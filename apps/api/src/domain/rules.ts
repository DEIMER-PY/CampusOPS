export function hasCapacity(capacity: number, attendees: number): boolean {
  return Number.isInteger(attendees) && attendees > 0 && attendees <= capacity;
}
export function overlaps(
  start: Date,
  end: Date,
  otherStart: Date,
  otherEnd: Date,
): boolean {
  return start < otherEnd && end > otherStart;
}
