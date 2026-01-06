function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function getOrCreateSessionId(): string {
  if (globalThis.window === undefined) return "server";
  const key = "perazzi_session_id";
  const existing = globalThis.window.localStorage.getItem(key);
  if (existing) return existing;

  const cryptoApi = globalThis.crypto;
  const perfNow = globalThis.performance?.now?.();
  let newId: string;

  if (cryptoApi?.randomUUID) {
    newId = cryptoApi.randomUUID();
  } else if (cryptoApi?.getRandomValues) {
    newId = bytesToHex(cryptoApi.getRandomValues(new Uint8Array(16)));
  } else {
    const perfStamp = perfNow === undefined ? "0" : perfNow.toString(16);
    newId = `${Date.now().toString(16)}-${perfStamp}`;
  }

  globalThis.window.localStorage.setItem(key, newId);
  return newId;
}
