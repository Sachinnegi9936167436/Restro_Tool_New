/**
 * In-memory sliding window rate limiter
 * Suitable for single-server deployments. Replace with Redis for multi-instance.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Check and increment rate limit for a given key.
 * @param key - Unique identifier (e.g. "email:user@example.com")
 * @param limit - Max allowed requests per window
 * @param windowMs - Window duration in milliseconds (default 1 hour)
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs = 60 * 60 * 1000
): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    // New window
    const resetAt = now + windowMs
    store.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1, resetAt }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

/** Clean up expired entries (call periodically) */
export function cleanupRateLimits(): void {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key)
  }
}
