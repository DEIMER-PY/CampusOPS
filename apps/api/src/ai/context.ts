import { database } from "../db.js";

export type CampusContext = {
  observedAt: string;
  resourceCount: number;
  resourcesTruncated: boolean;
  resources: {
    code: string;
    name: string;
    status: string;
    activeLoan: boolean;
  }[];
  spaceCount: number;
  spacesTruncated: boolean;
  spaces: { name: string; capacity: number; status: string }[];
  calendarAvailability: "NOT_INCLUDED";
};

// Same public operational fields available to authenticated community members.
// No owners, contact details, audit history or other users' reservations go to Groq.
export async function campusContext(): Promise<CampusContext> {
  const db = database();
  const [resources, resourceCount, spaces, spaceCount] = await db.$transaction(
    [
      db.resource.findMany({
        take: 20,
        orderBy: { code: "asc" },
        select: {
          code: true,
          name: true,
          status: true,
          loans: { where: { returnedAt: null }, select: { id: true }, take: 1 },
        },
      }),
      db.resource.count(),
      db.space.findMany({
        take: 20,
        orderBy: { name: "asc" },
        select: { name: true, capacity: true, status: true },
      }),
      db.space.count(),
    ],
    { isolationLevel: "RepeatableRead" },
  );
  return {
    observedAt: new Date().toISOString(),
    resourceCount,
    resourcesTruncated: resourceCount > resources.length,
    resources: resources.map(({ loans, ...resource }) => ({
      ...resource,
      activeLoan: loans.length > 0,
    })),
    spaceCount,
    spacesTruncated: spaceCount > spaces.length,
    spaces,
    calendarAvailability: "NOT_INCLUDED",
  };
}
