"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useCallback, useEffect, useRef, useState } from "react";

export interface RealtimeMessage {
  id: string;
  channelId?: string;
  channelSlug?: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  priority: "NORMAL" | "URGENT";
  mentions?: {
    spaces?: string[];
    resources?: string[];
    users?: string[];
  } | null;
  createdAt: string;
}

export interface PresenceUser {
  id: string;
  name: string;
  role: string;
}

export interface ChannelPresence {
  channelSlug: string;
  onlineCount: number;
  users: PresenceUser[];
}

export interface GlobalAlert {
  id: string;
  title: string;
  content: string;
  priority: "URGENT";
  channelSlug: string;
  authorName: string;
  authorRole: string;
  timestamp: string;
}

export interface MentionAlert {
  id: string;
  channelSlug: string;
  channelName: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

export interface MemberInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface ChannelInfo {
  id: string;
  slug: string;
  name: string;
  description: string;
  isBroadcastOnly: boolean;
  icon?: string;
  _count?: {
    messages: number;
  };
}

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting"
  | "error";

export function useCampusSocket({
  initialChannel = "avisos-generales",
  onGlobalAlert,
}: {
  initialChannel?: string;
  onGlobalAlert?: (alert: GlobalAlert) => void;
} = {}) {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [activeChannel, setActiveChannel] = useState<string>(initialChannel);
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [messages, setMessages] = useState<Record<string, RealtimeMessage[]>>(
    {},
  );
  const [presence, setPresence] = useState<Record<string, ChannelPresence>>({});
  const [globalAlert, setGlobalAlert] = useState<GlobalAlert | null>(null);
  const [mentionAlert, setMentionAlert] = useState<MentionAlert | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const isClosedIntentionallyRef = useRef<boolean>(false);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const activeChannelRef = useRef<string>(initialChannel);
  activeChannelRef.current = activeChannel;

  // Fetch channel catalogue and member directory
  const fetchMetadata = useCallback(async () => {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (!url || !key) return;

      const client = createBrowserClient(url, key);
      const {
        data: { session },
      } = await client.auth.getSession();
      if (!session) return;

      // Channels
      const res = await fetch("/api/channels", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setChannels(json.data);
        }
      }

      // Members
      const membersRes = await fetch("/api/members", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (membersRes.ok) {
        const mJson = await membersRes.json();
        if (mJson.data) {
          setMembers(mJson.data);
        }
      }
    } catch (err) {
      console.warn("No se pudieron cargar canales o miembros:", err);
    }
  }, []);

  const fetchChannelMessages = useCallback(async (slug: string) => {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (!url || !key) return;

      const client = createBrowserClient(url, key);
      const {
        data: { session },
      } = await client.auth.getSession();
      if (!session) return;

      const res = await fetch(
        `/api/channels/${encodeURIComponent(slug)}/messages`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        },
      );
      if (res.ok) {
        const json = await res.json();
        if (json.data?.messages) {
          setMessages((prev) => ({
            ...prev,
            [slug]: json.data.messages,
          }));
        }
      }
    } catch (err) {
      console.warn(`No se pudieron cargar mensajes para ${slug}:`, err);
    }
  }, []);

  // Connect to native WebSocket
  const connect = useCallback(async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      setStatus("disconnected");
      return;
    }

    try {
      const client = createBrowserClient(url, key);
      const {
        data: { session },
      } = await client.auth.getSession();

      if (!session?.access_token) {
        setStatus("disconnected");
        return;
      }

      setStatus("connecting");
      setErrorMessage(null);

      // Determine websocket URL
      const host =
        typeof window !== "undefined" ? window.location.host : "127.0.0.1:4000";
      const protocol =
        typeof window !== "undefined" && window.location.protocol === "https:"
          ? "wss:"
          : "ws:";

      let wsTarget = `${protocol}//${host}/ws`;
      if (typeof window !== "undefined" && window.location.port === "3000") {
        wsTarget = `${protocol}//${window.location.hostname}:4000/ws`;
      }
      if (process.env.NEXT_PUBLIC_WS_URL) {
        wsTarget = process.env.NEXT_PUBLIC_WS_URL;
      }

      const ws = new WebSocket(
        `${wsTarget}?token=${encodeURIComponent(session.access_token)}`,
      );
      socketRef.current = ws;

      ws.onopen = () => {
        setStatus("connected");
        if (activeChannelRef.current) {
          ws.send(
            JSON.stringify({
              type: "JOIN_CHANNEL",
              channelSlug: activeChannelRef.current,
            }),
          );
        }

        if (heartbeatIntervalRef.current)
          clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "PING" }));
          }
        }, 25_000);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          switch (payload.type) {
            case "AUTHENTICATED":
              break;

            case "CHANNEL_MESSAGE": {
              const msg: RealtimeMessage = payload.message;
              const ch = payload.channelSlug;
              setMessages((prev) => {
                const currentList = prev[ch] || [];
                if (currentList.some((m) => m.id === msg.id)) return prev;
                return {
                  ...prev,
                  [ch]: [...currentList, msg],
                };
              });
              break;
            }

            case "PRESENCE_UPDATE": {
              const rawUsers: PresenceUser[] = payload.users || [];
              const uniqueUsersMap = new Map<string, PresenceUser>();
              for (const u of rawUsers) {
                if (!uniqueUsersMap.has(u.id)) {
                  uniqueUsersMap.set(u.id, u);
                }
              }
              const cleanUsers = Array.from(uniqueUsersMap.values());
              setPresence((prev) => ({
                ...prev,
                [payload.channelSlug]: {
                  channelSlug: payload.channelSlug,
                  onlineCount: cleanUsers.length,
                  users: cleanUsers,
                },
              }));
              break;
            }

            case "USER_MENTIONED": {
              const alert: MentionAlert = {
                id: payload.message?.id || String(Date.now()),
                channelSlug: payload.channelSlug || "comms",
                channelName: payload.channelName || payload.channelSlug,
                authorName:
                  payload.authorName ||
                  payload.message?.authorName ||
                  "Un miembro",
                authorRole:
                  payload.authorRole || payload.message?.authorRole || "CAMPUS",
                content: payload.message?.content || "",
                createdAt:
                  payload.message?.createdAt || new Date().toISOString(),
              };
              setMentionAlert(alert);
              break;
            }

            case "GLOBAL_ANNOUNCEMENT": {
              const alert: GlobalAlert = {
                id: payload.message?.id || String(Date.now()),
                title: payload.title || "Aviso Oficial de Campuslands",
                content: payload.message?.content || payload.content || "",
                priority: "URGENT",
                channelSlug: payload.channelSlug || "avisos-generales",
                authorName: payload.message?.authorName || "Administración",
                authorRole: payload.message?.authorRole || "OPERATOR",
                timestamp:
                  payload.message?.createdAt || new Date().toISOString(),
              };
              setGlobalAlert(alert);
              if (onGlobalAlert) onGlobalAlert(alert);

              if (payload.message) {
                setMessages((prev) => {
                  const currentList = prev["avisos-generales"] || [];
                  if (currentList.some((m) => m.id === payload.message.id))
                    return prev;
                  return {
                    ...prev,
                    "avisos-generales": [...currentList, payload.message],
                  };
                });
              }
              break;
            }

            case "ERROR": {
              setErrorMessage(
                payload.message || "Error en el canal en tiempo real.",
              );
              break;
            }

            default:
              break;
          }
        } catch (e) {
          console.warn("Error parsing incoming socket message:", e);
        }
      };

      ws.onerror = (err) => {
        console.warn("WebSocket connection error:", err);
        setStatus("error");
      };

      ws.onclose = () => {
        if (isClosedIntentionallyRef.current) {
          setStatus("disconnected");
          return;
        }

        setStatus("reconnecting");
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        if (reconnectTimeoutRef.current)
          clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (!isClosedIntentionallyRef.current) {
            connect();
          }
        }, 3000);
      };
    } catch (e) {
      console.warn("Error initializing WebSocket client:", e);
      setStatus("error");
    }
  }, [onGlobalAlert]);

  // Initial connect & metadata fetch
  useEffect(() => {
    isClosedIntentionallyRef.current = false;
    fetchMetadata();
    connect();

    return () => {
      isClosedIntentionallyRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [fetchMetadata, connect]);

  // Switch channel
  const joinChannel = useCallback(
    (slug: string) => {
      if (slug === activeChannel) return;

      const ws = socketRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "LEAVE_CHANNEL",
            channelSlug: activeChannel,
          }),
        );
        ws.send(JSON.stringify({ type: "JOIN_CHANNEL", channelSlug: slug }));
      }

      setActiveChannel(slug);
      fetchChannelMessages(slug);
    },
    [activeChannel, fetchChannelMessages],
  );

  // Send message
  const sendMessage = useCallback(
    (
      content: string,
      priority: "NORMAL" | "URGENT" = "NORMAL",
      mentions?: { spaces?: string[]; resources?: string[]; users?: string[] },
    ) => {
      const ws = socketRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        setErrorMessage(
          "No hay conexión con el servidor de mensajería en tiempo real.",
        );
        return false;
      }

      setErrorMessage(null);
      ws.send(
        JSON.stringify({
          type: "SEND_MESSAGE",
          channelSlug: activeChannel,
          content,
          priority,
          mentions,
        }),
      );
      return true;
    },
    [activeChannel],
  );

  // Admin update member role
  const updateMemberRole = useCallback(
    async (userId: string, newRole: string) => {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
        if (!url || !key) return false;
        const client = createBrowserClient(url, key);
        const {
          data: { session },
        } = await client.auth.getSession();
        if (!session) return false;

        const res = await fetch(
          `/api/admin/users/${encodeURIComponent(userId)}/role`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ role: newRole }),
          },
        );

        if (res.ok) {
          setMembers((prev) =>
            prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m)),
          );
          return true;
        }
        return false;
      } catch (e) {
        console.error("Error updating member role:", e);
        return false;
      }
    },
    [],
  );

  const dismissGlobalAlert = useCallback(() => {
    setGlobalAlert(null);
  }, []);

  const dismissMentionAlert = useCallback(() => {
    setMentionAlert(null);
  }, []);

  return {
    status,
    activeChannel,
    channels,
    members,
    messages: messages[activeChannel] || [],
    allMessages: messages,
    presence: presence[activeChannel] || {
      channelSlug: activeChannel,
      onlineCount: 0,
      users: [],
    },
    allPresence: presence,
    globalAlert,
    mentionAlert,
    errorMessage,
    joinChannel,
    sendMessage,
    dismissGlobalAlert,
    dismissMentionAlert,
    updateMemberRole,
    refreshMessages: () => fetchChannelMessages(activeChannel),
  };
}
