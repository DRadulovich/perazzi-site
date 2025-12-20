const TLS_DIAG_ENABLED = process.env.PERAZZI_TLS_DIAG === "1";

function baseEnvFlags() {
  return {
    NODE_TLS_REJECT_UNAUTHORIZED_present: "NODE_TLS_REJECT_UNAUTHORIZED" in process.env,
    NODE_EXTRA_CA_CERTS_present: Boolean(process.env.NODE_EXTRA_CA_CERTS),
    SSL_CERT_FILE_present: Boolean(process.env.SSL_CERT_FILE),
    HTTPS_PROXY_present: Boolean(process.env.HTTPS_PROXY),
    HTTP_PROXY_present: Boolean(process.env.HTTP_PROXY),
    NO_PROXY_present: Boolean(process.env.NO_PROXY),
  };
}

function resolveHost(urlish: string | undefined | null): string | null {
  if (!urlish) return null;
  try {
    const parsed = new URL(urlish);
    return parsed.hostname || null;
  } catch {
    return null;
  }
}

function logTlsDiag(payload: Record<string, unknown>) {
  if (!TLS_DIAG_ENABLED) return;
  console.info(JSON.stringify({ type: "perazzi-tls-diag", ...payload, ...baseEnvFlags() }));
}

export function logTlsDiagForOpenAI(
  target: string,
  baseUrl?: string,
  usedGateway?: boolean,
): void {
  if (!TLS_DIAG_ENABLED) return;

  const openaiBaseHost = resolveHost(baseUrl ?? "https://api.openai.com");
  logTlsDiag({
    target,
    openaiBaseHost,
    openaiBaseUrlProvided: Boolean(baseUrl),
    usingGateway: Boolean(usedGateway),
    usingProxy: Boolean(process.env.HTTPS_PROXY || process.env.HTTP_PROXY),
  });
}

export function logTlsDiagForDb(
  target: string,
  connectionString?: string,
  sslMode?: string | boolean,
  options?: { hasCa?: boolean },
): void {
  if (!TLS_DIAG_ENABLED) return;

  const dbHost = resolveHost(connectionString ?? null);
  let normalizedSslMode: string | null = null;
  if (typeof sslMode === "string") {
    normalizedSslMode = sslMode.toLowerCase();
  } else if (sslMode === true) {
    normalizedSslMode = "require";
  }

  logTlsDiag({
    target,
    dbHost,
    sslMode: normalizedSslMode,
    usingProxy: Boolean(process.env.HTTPS_PROXY || process.env.HTTP_PROXY),
    ...(typeof options?.hasCa === "boolean" ? { hasCa: options.hasCa } : {}),
  });
}
