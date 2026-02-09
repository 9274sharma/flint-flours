/**
 * Simple in-memory rate limiter for API routes.
 * Note: In serverless/multi-instance, each instance has its own store.
 * For production at scale, consider Redis-based solution (e.g. @upstash/ratelimit).
 */

const store = new Map<string, { count: number; resetAt: number }>();
const CLEANUP_INTERVAL = 60_000; // 1 minute

function cleanup() {
  const now = Date.now();
  Array.from(store.entries()).forEach(([key, value]) => {
    if (value.resetAt < now) store.delete(key);
  });
}

let cleanupTimer: ReturnType<typeof setInterval> | null = null;
function scheduleCleanup() {
  if (!cleanupTimer) {
    cleanupTimer = setInterval(cleanup, CLEANUP_INTERVAL);
    if (cleanupTimer.unref) cleanupTimer.unref();
  }
}

export type RateLimitOptions = {
  /** Max requests per window */
  limit: number;
  /** Window in seconds */
  windowSeconds: number;
};

/**
 * Check rate limit for identifier (e.g. IP or user ID).
 * Returns true if allowed, false if blocked.
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): { allowed: boolean; remaining: number } {
  scheduleCleanup();
  const now = Date.now();
  const key = identifier;
  const windowMs = options.windowSeconds * 1000;

  let entry = store.get(key);
  if (!entry) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: options.limit - 1 };
  }

  if (entry.resetAt < now) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(key, entry);
    return { allowed: true, remaining: options.limit - 1 };
  }

  entry.count++;
  const remaining = Math.max(0, options.limit - entry.count);
  return {
    allowed: entry.count <= options.limit,
    remaining,
  };
}

/**
 * Get client identifier from request (Forwarded, X-Real-IP, Vercel-ID, or fallback).
 * Avoids "unknown" shared across all clients when behind proxy without IP headers.
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  const vercelId = request.headers.get("x-vercel-id");
  if (vercelId) return vercelId;
  const userAgent = request.headers.get("user-agent") ?? "";
  const accept = request.headers.get("accept") ?? "";
  return `fallback:${hashString(userAgent + accept).slice(0, 16)}`;
}

function hashString(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}
