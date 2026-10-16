export function parseParticipants(value: string) {
  return value
    .split(/[,\r\n]/)
    .map((name) => name.trim())
    .filter(Boolean);
}
