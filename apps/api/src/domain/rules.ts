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
export function canLoanResource(
  status: string,
  hasActiveLoan: boolean,
): boolean {
  return status === "AVAILABLE" && !hasActiveLoan;
}
export function canReturnLoan(returnedAt: Date | null): boolean {
  return returnedAt === null;
}
export function canActorReturnLoan(
  loanUserId: string,
  actor: { id: string; role: string },
): boolean {
  return (
    actor.id === loanUserId ||
    actor.role === "OPERATOR" ||
    actor.role === "ADMIN"
  );
}
