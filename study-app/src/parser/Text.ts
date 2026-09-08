export function normalize(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function comparable(value: string): string {
  return normalize(value).replace(/^[^a-z0-9]+/i, "").toLowerCase();
}
