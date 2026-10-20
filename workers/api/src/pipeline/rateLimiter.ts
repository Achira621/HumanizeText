/**
 * Edge Sliding-Window Rate Limiter
 * 
 * Enforces per-minute request quotas per client IP without external database overhead.
 */

interface RateBucket {
  count: number;
  resetAt: number;
}

const ipBuckets = new Map<string, RateBucket>();

// Clean up stale buckets every 5 minutes to prevent memory leaks
let lastCleanup = Date.now();

function purgeStaleBuckets(now: number) {
  if (now - lastCleanup > 300_000) {
    lastCleanup = now;
    for (const [ip, bucket] of ipBuckets.entries()) {
      if (bucket.resetAt < now) {
        ipBuckets.delete(ip);
      }
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Checks and increments rate limit for a client IP.
 */
export function checkRateLimit(clientIp: string, maxPerMinute = 15): RateLimitResult {
  const now = Date.now();
  purgeStaleBuckets(now);

  const windowMs = 60_000;
  const bucket = ipBuckets.get(clientIp);

  if (!bucket || bucket.resetAt < now) {
    ipBuckets.set(clientIp, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      limit: maxPerMinute,
      remaining: maxPerMinute - 1,
      resetSeconds: 60,
    };
  }

  bucket.count += 1;
  const remaining = Math.max(0, maxPerMinute - bucket.count);
  const resetSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

  if (bucket.count > maxPerMinute) {
    return {
      allowed: false,
      limit: maxPerMinute,
      remaining: 0,
      resetSeconds,
    };
  }

  return {
    allowed: true,
    limit: maxPerMinute,
    remaining,
    resetSeconds,
  };
}
