import "server-only";

// In-memory brute-force throttle for login. Keyed by email (lowercased).
// Note: this is per-process — fine for a single Render instance. For
// horizontal scaling, move this to a shared store (Redis/DB).

type Entry = { count: number; firstAt: number; lockedUntil: number };

const attempts = new Map<string, Entry>();

const WINDOW_MS = 15 * 60 * 1000; // count failures within 15 minutes
const MAX_FAILURES = 5; // lock after this many
const LOCK_MS = 15 * 60 * 1000; // lock duration

export function checkRateLimit(key: string): {
  allowed: boolean;
  retryAfterMs: number;
} {
  const e = attempts.get(key);
  const now = Date.now();
  if (e && e.lockedUntil > now) {
    return { allowed: false, retryAfterMs: e.lockedUntil - now };
  }
  return { allowed: true, retryAfterMs: 0 };
}

export function recordFailure(key: string) {
  const now = Date.now();
  const e = attempts.get(key);
  if (!e || now - e.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: now, lockedUntil: 0 });
    return;
  }
  e.count += 1;
  if (e.count >= MAX_FAILURES) {
    e.lockedUntil = now + LOCK_MS;
  }
}

export function recordSuccess(key: string) {
  attempts.delete(key);
}
