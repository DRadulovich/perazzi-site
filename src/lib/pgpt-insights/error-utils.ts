export function errorMessage(error: unknown): string {
  if (!error) return "Unknown error.";
  if (error instanceof Error) return error.message || "Unknown error.";
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
