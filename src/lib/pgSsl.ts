export type PgSslOptions = false | { rejectUnauthorized: true; ca?: string };

function getPgSslMode(): string {
  const raw = (process.env.PGSSL_MODE ?? "").trim().toLowerCase();
  return raw || "require";
}

function normalizePgCaCert(): string | undefined {
  const raw = process.env.PG_CA_CERT_PEM;
  if (!raw) return undefined;
  const normalized = raw.replace(/\\n/g, "\n");
  const trimmed = normalized.trim();
  return trimmed.length > 0 ? normalized : undefined;
}

export function getPgSslOptions(): PgSslOptions {
  const mode = getPgSslMode();
  if (mode === "disable") return false;

  const ca = normalizePgCaCert();
  return ca ? { rejectUnauthorized: true, ca } : { rejectUnauthorized: true };
}

export function getPgSslDiagnostics(): { sslMode: string; hasCa: boolean } {
  const mode = getPgSslMode();
  const ca = normalizePgCaCert();
  return { sslMode: mode, hasCa: Boolean(ca) };
}
