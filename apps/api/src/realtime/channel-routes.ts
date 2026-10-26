import { Router } from "express";
import { z } from "zod";
import { database } from "../db.js";

export const channelRoutes = Router();

const roleSchema = z.enum([
  "ADMIN",
  "FORMACION",
  "COWORKING",
  "MARKETING",
  "SOPORTE",
  "FULL_SERVICE",
  "CLONAI",
  "CLIENT",
  "OPERATOR",
]);

// GET /api/channels
channelRoutes.get("/channels", async (_req, res) => {
  try {
    const channels = await database().communicationChannel.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    res.json({ data: channels });
  } catch (err) {
    console.error("Error fetching channels:", err);
    res.status(500).json({ error: { message: "Error al obtener canales." } });
  }
});

// GET /api/channels/:slug/messages
channelRoutes.get("/channels/:slug/messages", async (req, res) => {
  const { slug } = req.params;
  const before =
    typeof req.query.before === "string"
      ? new Date(req.query.before)
      : undefined;
  try {
    const channel = await database().communicationChannel.findUnique({
      where: { slug },
    });

    if (!channel) {
      res.status(404).json({ error: { message: "Canal no encontrado." } });
      return;
    }

    const messages = await database().channelMessage.findMany({
      where: {
        channelId: channel.id,
        ...(before && !Number.isNaN(before.getTime())
          ? { createdAt: { lt: before } }
          : {}),
      },
      take: 50,
      orderBy: { createdAt: "desc" },
    });

    res.json({
      data: {
        channel,
        messages: messages.reverse(),
      },
    });
  } catch (err) {
    console.error(`Error fetching messages for channel ${slug}:`, err);
    res.status(500).json({ error: { message: "Error al obtener mensajes." } });
  }
});

// GET /api/members (list all members with their assigned area/role)
channelRoutes.get("/members", async (_req, res) => {
  const actor = res.locals.actor;
  const isPrivileged = actor?.role === "ADMIN" || actor?.role === "OPERATOR";
  try {
    const members = await database().profile.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: isPrivileged,
        role: true,
      },
    });

    res.json({ data: members });
  } catch (err) {
    console.error("Error fetching members:", err);
    res.status(500).json({ error: { message: "Error al obtener miembros." } });
  }
});

// GET /api/admin/users
channelRoutes.get("/admin/users", async (_req, res) => {
  const actor = res.locals.actor;
  if (actor.role !== "ADMIN") {
    res
      .status(403)
      .json({ error: { message: "Acceso exclusivo para administradores." } });
    return;
  }
  try {
    const users = await database().profile.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: users });
  } catch (err) {
    console.error("Error listing users for admin:", err);
    res.status(500).json({ error: { message: "Error al listar usuarios." } });
  }
});

// PATCH /api/admin/users/:id/role
channelRoutes.patch("/admin/users/:id/role", async (req, res) => {
  const actor = res.locals.actor;
  if (actor.role !== "ADMIN") {
    res
      .status(403)
      .json({ error: { message: "Acceso exclusivo para administradores." } });
    return;
  }
  const { id } = req.params;
  const parsed = z.object({ role: roleSchema }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: { message: "Rol/área inválida." } });
    return;
  }
  try {
    const updated = await database().profile.update({
      where: { id },
      data: { role: parsed.data.role },
    });
    res.json({ data: updated });
  } catch (err) {
    console.error(`Error updating role for user ${id}:`, err);
    res
      .status(500)
      .json({ error: { message: "Error al actualizar área del usuario." } });
  }
});
