export function logAnalytics(event: string, detail?: unknown) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  if (detail !== undefined) {
    console.log(`[analytics] ${event}`, detail);
    return;
  }

  console.log(`[analytics] ${event}`);
}
