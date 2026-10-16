import { readFileSync } from "node:fs";
import { z } from "zod";
import { database, disconnectDatabase } from "../src/db.js";
import { scheduleEntry } from "../src/schedule.js";

const input = z
  .strictObject({
    sourceKey: z.string().min(1),
    sourceHash: z.string().length(64),
    title: z.string(),
    timezone: z.literal("America/Bogota"),
    applicableDate: z.null(),
    rooms: z.array(z.string()).min(1),
    entries: z.array(scheduleEntry).min(1),
  })
  .parse(
    JSON.parse(
      readFileSync(
        new URL(
          "../../../data/imports/schedule-reference.json",
          import.meta.url,
        ),
        "utf8",
      ),
    ),
  );
if (
  input.entries.some(
    (e) => e.startMinute >= e.endMinute || !input.rooms.includes(e.room),
  )
)
  throw new Error("INVALID_SOURCE_INTERVAL_OR_ROOM");
try {
  const db = database();
  const existing = await db.scheduleBoard.findUnique({
    where: { sourceKey: input.sourceKey },
    select: { id: true, revision: true },
  });
  if (existing)
    console.log(
      JSON.stringify({
        status: "already_imported",
        id: existing.id,
        revision: existing.revision,
      }),
    );
  else {
    const { applicableDate, ...data } = input;
    const board = await db.scheduleBoard.create({ data });
    console.log(
      JSON.stringify({
        status: "imported",
        id: board.id,
        blocks: input.entries.length,
        dated: false,
      }),
    );
  }
} finally {
  await disconnectDatabase();
}
