import { Redis } from '@upstash/redis'

export const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// In-memory fallback per serverless instance (not shared across Vercel instances)
const inMemoryStore = new Map<string, { count: number; resetAt: number }>()

function checkInMemoryLimit(
  ip: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = inMemoryStore.get(ip)

  if (!entry || now > entry.resetAt) {
    inMemoryStore.set(ip, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }

  entry.count++
  if (entry.count > limit) return { allowed: false, remaining: 0 }
  return { allowed: true, remaining: limit - entry.count }
}

export async function checkRedisRateLimit(
  ip: string,
  limit: number = 10,
  windowSeconds: number = 60,
  namespace: string = 'chatbot'
): Promise<{ allowed: boolean; remaining: number }> {
  if (!redis) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Redis not configured - using in-memory rate limiter')
    }
    // Include namespace in in-memory key to prevent cross-endpoint counter sharing
    return checkInMemoryLimit(`${namespace}:${ip}`, limit, windowSeconds * 1000)
  }

  // Namespace separates rate limit counters per endpoint (chatbot, app-track, etc.)
  // Without this, 10 chatbot requests would also block app-track requests.
  const key = `ratelimit:${namespace}:${ip}`

  try {
    // Atomic increment-first pattern (fixes TOCTOU race condition)
    const count = await redis.incr(key)
    if (count === 1) {
      // Set TTL only on first request in window
      await redis.expire(key, windowSeconds)
    }

    if (count > limit) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚫 Rate limit exceeded for IP ${ip} (${count}/${limit})`)
      }
      return { allowed: false, remaining: 0 }
    }

    return { allowed: true, remaining: limit - count }
  } catch (error) {
    console.error('❌ Redis error, falling back to in-memory limiter:', error)
    // Fallback to in-memory instead of fail-open (include namespace to avoid counter sharing)
    return checkInMemoryLimit(`${namespace}:${ip}`, limit, windowSeconds * 1000)
  }
}
