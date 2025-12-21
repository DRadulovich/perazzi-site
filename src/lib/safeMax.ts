// Safe Math.max helper which returns 0 for empty arrays to avoid -Infinity errors.
export function safeMax(values: number[]): number {
  return values.length ? Math.max(...values) : 0;
}
