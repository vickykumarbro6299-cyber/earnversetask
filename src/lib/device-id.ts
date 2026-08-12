const KEY = "earnverse_device_id";

/** Stable-ish per-device fingerprint: persisted id + hardware/browser signature. */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  const stored = localStorage.getItem(KEY);
  if (stored) return stored;

  const n = navigator;
  const raw = [
    n.userAgent,
    n.language,
    n.hardwareConcurrency ?? 0,
    (n as unknown as { deviceMemory?: number }).deviceMemory ?? 0,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
  ].join("|");

  let h1 = 0x811c9dc5;
  for (let i = 0; i < raw.length; i++) {
    h1 ^= raw.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193) >>> 0;
  }
  const id = `dev_${h1.toString(16)}_${btoa(raw).slice(0, 24).replace(/[^a-zA-Z0-9]/g, "")}`;
  localStorage.setItem(KEY, id);
  return id;
}
