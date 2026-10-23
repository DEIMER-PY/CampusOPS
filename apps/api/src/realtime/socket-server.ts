import type { Server } from "node:http";
import { createClient } from "@supabase/supabase-js";
import { WebSocket, WebSocketServer } from "ws";
import { database } from "../db.js";
import type { MessagePriority, Role } from "../generated/prisma/enums.js";

interface ConnectedClient {
  ws: WebSocket;
  userId: string;
  role: Role;
  email: string;
  name: string;
  activeChannels: Set<string>;
  isAlive: boolean;
}

interface IncomingPayload {
  type: "JOIN_CHANNEL" | "LEAVE_CHANNEL" | "SEND_MESSAGE" | "PING";
  channelSlug?: string;
  content?: string;
  priority?: MessagePriority;
  mentions?: {
    spaces?: string[];
    resources?: string[];
    users?: string[];
  };
}

let wss: WebSocketServer | undefined;
const clients = new Map<WebSocket, ConnectedClient>();

export function setupWebSocketServer(server: Server) {
  wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", async (request, socket, head) => {
    try {
      const url = new URL(
        request.url || "",
        `http://${request.headers.host || "localhost"}`,
      );
      if (url.pathname !== "/ws") {
        socket.destroy();
        return;
      }

      const token =
        url.searchParams.get("token") ||
        request.headers.authorization?.replace(/^Bearer\s+/i, "");
      if (!token) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
      if (!supabaseUrl || !supabaseKey) {
        socket.write("HTTP/1.1 503 Service Unavailable\r\n\r\n");
        socket.destroy();
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      const profile = await database().profile.findUnique({
        where: { id: data.user.id },
      });

      if (!profile) {
        socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
        socket.destroy();
        return;
      }

      wss?.handleUpgrade(request, socket, head, (ws) => {
        const clientEmail =
          profile.email || data.user.email || "usuario@campuslands.com";
        const clientName =
          profile.name ||
          (data.user.user_metadata?.full_name as string) ||
          clientEmail.split("@")[0] ||
          "Usuario";

        const clientData: ConnectedClient = {
          ws,
          userId: profile.id,
          role: profile.role,
          email: clientEmail,
          name: clientName,
          activeChannels: new Set<string>(),
          isAlive: true,
        };

        clients.set(ws, clientData);
        wss?.emit("connection", ws, request);
      });
    } catch (err) {
      console.error("Error during WebSocket upgrade:", err);
      socket.destroy();
    }
  });

  wss.on("connection", (ws: WebSocket) => {
    const client = clients.get(ws);
    if (!client) return;

    ws.on("pong", () => {
      client.isAlive = true;
    });

    ws.on("message", async (rawMessage) => {
      try {
        const payload: IncomingPayload = JSON.parse(rawMessage.toString());
        await handleClientMessage(client, payload);
      } catch (err) {
        console.error("Error handling WS message:", err);
        sendToSocket(ws, {
          type: "ERROR",
          message: "Formato de mensaje inválido.",
        });
      }
    });

    ws.on("close", () => {
      handleClientDisconnect(client);
    });

    ws.on("error", (error) => {
      console.error(`WebSocket error for user ${client.userId}:`, error);
    });

    // Send initial welcome message
    sendToSocket(ws, {
      type: "CONNECTED",
      user: {
        id: client.userId,
        name: client.name,
        role: client.role,
      },
    });
  });

  // Heartbeat interval to check alive connections every 30s
  const heartbeatInterval = setInterval(() => {
    wss?.clients.forEach((ws) => {
      const client = clients.get(ws);
      if (!client) return;

      if (!client.isAlive) {
        ws.terminate();
        clients.delete(ws);
        return;
      }

      client.isAlive = false;
      ws.ping();
    });
  }, 30_000);

  wss.on("close", () => {
    clearInterval(heartbeatInterval);
  });

  return wss;
}

async function handleClientMessage(
  client: ConnectedClient,
  payload: IncomingPayload,
) {
  switch (payload.type) {
    case "PING": {
      sendToSocket(client.ws, { type: "PONG", timestamp: Date.now() });
      break;
    }

    case "JOIN_CHANNEL": {
      const slug = payload.channelSlug;
      if (!slug) return;

      client.activeChannels.add(slug);
      broadcastPresence(slug);
      break;
    }

    case "LEAVE_CHANNEL": {
      const slug = payload.channelSlug;
      if (!slug) return;

      client.activeChannels.delete(slug);
      broadcastPresence(slug);
      break;
    }

    case "SEND_MESSAGE": {
      const slug = payload.channelSlug;
      const content = payload.content?.trim();
      const priority: MessagePriority =
        payload.priority === "URGENT" ? "URGENT" : "NORMAL";

      if (!slug || !content) {
        sendToSocket(client.ws, {
          type: "ERROR",
          message: "El contenido y el canal son requeridos.",
        });
        return;
      }

      if (content.length > 2000) {
        sendToSocket(client.ws, {
          type: "ERROR",
          message: "El mensaje no puede superar los 2000 caracteres.",
        });
        return;
      }

      const channel = await database().communicationChannel.findUnique({
        where: { slug },
      });

      if (!channel) {
        sendToSocket(client.ws, {
          type: "ERROR",
          message: "El canal solicitado no existe.",
        });
        return;
      }

      // Business Rule: Broadcast channels (avisos-generales) can only be posted by OPERATOR or ADMIN
      if (
        channel.isBroadcastOnly &&
        !["OPERATOR", "ADMIN"].includes(client.role)
      ) {
        sendToSocket(client.ws, {
          type: "ERROR",
          message:
            "Solo administradores y operadores pueden publicar en Avisos Generales.",
        });
        return;
      }

      // Persist to database
      const savedMessage = await database().channelMessage.create({
        data: {
          channelId: channel.id,
          authorId: client.userId,
          authorName: client.name,
          authorRole: client.role,
          content,
          priority,
          mentions: payload.mentions || {},
        },
      });

      const messageOut = {
        type: "CHANNEL_MESSAGE",
        channelSlug: slug,
        message: {
          id: savedMessage.id,
          channelSlug: slug,
          authorId: savedMessage.authorId,
          authorName: savedMessage.authorName,
          authorRole: savedMessage.authorRole,
          content: savedMessage.content,
          priority: savedMessage.priority,
          mentions: savedMessage.mentions,
          createdAt: savedMessage.createdAt.toISOString(),
        },
      };

      // Broadcast to room
      broadcastToChannel(slug, messageOut);

      // If priority is URGENT, broadcast global announcement to ALL connected users
      if (priority === "URGENT") {
        broadcastGlobalAnnouncement({
          type: "GLOBAL_ANNOUNCEMENT",
          channelSlug: slug,
          channelName: channel.name,
          message: messageOut.message,
        });
      }

      // If message mentions specific users, notify them directly
      if (payload.mentions?.users?.length) {
        const mentionedUsers = payload.mentions.users;
        const mentionPayload = JSON.stringify({
          type: "USER_MENTIONED",
          channelSlug: slug,
          channelName: channel.name,
          message: messageOut.message,
          authorName: client.name,
          authorRole: client.role,
        });

        for (const targetClient of clients.values()) {
          if (targetClient.userId === client.userId) continue;
          const isTarget = mentionedUsers.some((u) => {
            const clean = u.toLowerCase();
            return (
              targetClient.userId.toLowerCase() === clean ||
              targetClient.name.toLowerCase() === clean ||
              targetClient.name.toLowerCase().includes(clean)
            );
          });
          if (isTarget && targetClient.ws.readyState === WebSocket.OPEN) {
            targetClient.ws.send(mentionPayload);
          }
        }
      }

      break;
    }
  }
}

function handleClientDisconnect(client: ConnectedClient) {
  const affectedChannels = Array.from(client.activeChannels);
  clients.delete(client.ws);

  for (const slug of affectedChannels) {
    broadcastPresence(slug);
  }
}

function broadcastToChannel(channelSlug: string, data: object) {
  const serialized = JSON.stringify(data);
  for (const client of clients.values()) {
    if (
      client.activeChannels.has(channelSlug) &&
      client.ws.readyState === WebSocket.OPEN
    ) {
      client.ws.send(serialized);
    }
  }
}

function broadcastGlobalAnnouncement(data: object) {
  const serialized = JSON.stringify(data);
  for (const client of clients.values()) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(serialized);
    }
  }
}

function broadcastPresence(channelSlug: string) {
  const members = [];
  for (const client of clients.values()) {
    if (client.activeChannels.has(channelSlug)) {
      members.push({
        id: client.userId,
        name: client.name,
        role: client.role,
      });
    }
  }

  const payload = JSON.stringify({
    type: "PRESENCE_UPDATE",
    channelSlug,
    onlineCount: members.length,
    users: members,
  });

  for (const client of clients.values()) {
    if (
      client.activeChannels.has(channelSlug) &&
      client.ws.readyState === WebSocket.OPEN
    ) {
      client.ws.send(payload);
    }
  }
}

function sendToSocket(ws: WebSocket, data: object) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

export function closeSocketServer() {
  if (wss) {
    wss.close();
    clients.clear();
  }
}
