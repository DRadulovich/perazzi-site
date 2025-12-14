# 12 - CODE FOR: `src/lib/session.ts`

---

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "server";
  const key = "perazzi_session_id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const newId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(key, newId);
  return newId;
}

---