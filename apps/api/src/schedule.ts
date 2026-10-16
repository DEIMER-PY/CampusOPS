import { Router } from "express";
import { z } from "zod";
import { database } from "./db.js";
export const scheduleEntry = z.object({
  id: z.string(),
  category: z.enum(["SOFTWARE", "ENGLISH", "SER"]),
  room: z.string(),
  startMinute: z.number().int().min(0).max(1439),
  endMinute: z.number().int().min(1).max(1440),
  label: z.string(),
  attendees: z.number().int().nonnegative().nullable(),
  course: z.string().nullable(),
  instructor: z.string().nullable(),
  status: z.enum(["DRAFT", "CANCELLED"]),
  metadata: z.record(z.string(), z.string()),
  timeConfidence: z.string(),
  spaceId: z.uuid().nullable(),
});
export type ScheduleEntry = z.infer<typeof scheduleEntry>;
export function scheduleIssues(
  entry: ScheduleEntry,
  entries: ScheduleEntry[],
  spaces: { id: string; capacity: number; status: string }[],
) {
  if (entry.status === "CANCELLED")
    return ["Cancelado en la fuente; no ocupa una franja activa."];
  const issues: string[] = [];
  const space = spaces.find((s) => s.id === entry.spaceId);
  if (!space)
    issues.push("Sala del horario pendiente de vincular al catálogo.");
  else {
    if (space.status !== "AVAILABLE")
      issues.push("El espacio vinculado no está habilitado.");
    if (entry.attendees !== null && entry.attendees > space.capacity)
      issues.push("El grupo supera el aforo del espacio vinculado.");
  }
  if (
    entry.metadata.sourceLocation &&
    !entry.metadata.sourceLocation
      .toLowerCase()
      .startsWith(entry.room.toLowerCase())
  )
    issues.push(
      "La ubicación escrita en el bloque difiere de la columna de la fuente; confirmar antes de asignar.",
    );
  if (entry.attendees === 0)
    issues.push("La fuente indica cero asistentes; confirmar el grupo.");
  if (entry.timeConfidence !== "VISIBLE")
    issues.push("Franja inferida del bloque visual; confirmar horas.");
  for (const other of entries) {
    if (
      other.id === entry.id ||
      other.status === "CANCELLED" ||
      other.startMinute >= entry.endMinute ||
      other.endMinute <= entry.startMinute
    )
      continue;
    if (
      (entry.spaceId && entry.spaceId === other.spaceId) ||
      entry.room === other.room
    )
      issues.push(`Cruce de sala con ${other.label}.`);
    if (entry.instructor && entry.instructor === other.instructor)
      issues.push(`Cruce de instructor con ${other.label}.`);
  }
  return [...new Set(issues)];
}
export const scheduleRoutes = Router();
scheduleRoutes.get("/schedule", async (_req, res) => {
  const db = database(),
    board = await db.scheduleBoard.findFirst({
      orderBy: { createdAt: "desc" },
    });
  if (!board) {
    res.json({ data: null });
    return;
  }
  const entries = z.array(scheduleEntry).parse(board.entries);
  const spaces = await db.space.findMany({
    select: { id: true, name: true, status: true, capacity: true },
  });
  res.json({
    data: {
      ...board,
      entries: entries.map((entry) => ({
        ...entry,
        issues: scheduleIssues(entry, entries, spaces),
      })),
      spaces,
    },
  });
});
const patch = z
  .strictObject({
    expectedRevision: z.number().int().positive(),
    label: z.string().trim().min(2).max(100),
    category: z.enum(["SOFTWARE", "ENGLISH", "SER"]),
    room: z.string().max(100),
    startMinute: z.number().int().min(0).max(1439).multipleOf(15),
    endMinute: z.number().int().min(1).max(1440).multipleOf(15),
    attendees: z.number().int().min(0).max(500).nullable(),
    course: z.string().trim().max(100).nullable(),
    instructor: z.string().trim().max(100).nullable(),
    status: z.enum(["DRAFT", "CANCELLED"]),
    spaceId: z.uuid().nullable(),
  })
  .refine((v) => v.endMinute > v.startMinute, {
    message: "El fin debe ser posterior al inicio.",
  });
scheduleRoutes.patch("/schedule/:id/entries/:entryId", async (req, res) => {
  const actor = res.locals.actor;
  if (!["ADMIN", "OPERATOR"].includes(actor.role)) {
    res.status(403).json({
      error: {
        message: "La edición de horarios requiere un perfil de operación.",
      },
    });
    return;
  }
  const boardId = z.uuid().parse(req.params.id),
    entryId = z.string().max(80).parse(req.params.entryId),
    input = patch.parse(req.body),
    db = database();
  const result = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM app_private."ScheduleBoard" WHERE id=${boardId}::uuid FOR UPDATE`;
    const board = await tx.scheduleBoard.findUnique({ where: { id: boardId } });
    if (!board) return { status: 404, message: "No se encontró la plantilla." };
    if (board.revision !== input.expectedRevision)
      return {
        status: 409,
        message:
          "Otro integrante actualizó el horario. Recarga antes de guardar.",
      };
    const rooms = z.array(z.string()).parse(board.rooms),
      entries = z.array(scheduleEntry).parse(board.entries),
      index = entries.findIndex((e) => e.id === entryId);
    if (index < 0 || !rooms.includes(input.room))
      return {
        status: 400,
        message: "El bloque o la sala no pertenecen a esta plantilla.",
      };
    if (
      input.spaceId &&
      !(await tx.space.findUnique({
        where: { id: input.spaceId },
        select: { id: true },
      }))
    )
      return { status: 400, message: "El espacio vinculado no existe." };
    const { expectedRevision, ...changes } = input;
    const candidate = { ...entries[index], ...changes };
    if (
      candidate.status !== "CANCELLED" &&
      entries.some(
        (other) =>
          other.id !== entryId &&
          other.status !== "CANCELLED" &&
          other.startMinute < candidate.endMinute &&
          other.endMinute > candidate.startMinute &&
          ((candidate.spaceId && candidate.spaceId === other.spaceId) ||
            candidate.room === other.room ||
            (candidate.instructor &&
              candidate.instructor === other.instructor)),
      )
    )
      return {
        status: 409,
        message:
          "La edición produce un cruce de sala o instructor. Revisa la franja antes de guardar.",
      };
    entries[index] = candidate;
    await tx.scheduleBoard.update({
      where: { id: boardId },
      data: { entries, revision: { increment: 1 }, updatedBy: actor.id },
    });
    await tx.auditEvent.create({
      data: {
        actorId: actor.id,
        entityId: boardId,
        action: "schedule.entry_updated",
      },
    });
    return {
      status: 200,
      message: "Horario guardado como plantilla. No se crearon reservas.",
    };
  });
  res
    .status(result.status)
    .json(
      result.status === 200
        ? { data: result }
        : { error: { message: result.message } },
    );
});
