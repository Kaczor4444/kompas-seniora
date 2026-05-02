import { Redis } from '@upstash/redis'

// Initialize Redis client (Upstash/Vercel KV)
// Free tier: 10,000 requests/day, 256MB storage
export const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// Rate limiting using Redis
export async function checkRedisRateLimit(
  ip: string,
  limit: number = 10,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number }> {
  // Fallback to allow if Redis not configured
  if (!redis) {
    console.warn('⚠️ Redis not configured - rate limiting disabled')
    return { allowed: true, remaining: limit }
  }

  const key = `ratelimit:chatbot:${ip}`

  try {
    // Get current count
    const current = await redis.get<number>(key)

    if (!current) {
      // First request - set count to 1 with TTL
      await redis.setex(key, windowSeconds, 1)
      return { allowed: true, remaining: limit - 1 }
    }

    if (current >= limit) {
      // Rate limit exceeded
      const ttl = await redis.ttl(key)
      console.log(`🚫 Rate limit exceeded for IP ${ip} (${current}/${limit}), TTL: ${ttl}s`)
      return { allowed: false, remaining: 0 }
    }

    // Increment count
    await redis.incr(key)
    return { allowed: true, remaining: limit - current - 1 }
  } catch (error) {
    console.error('❌ Redis error:', error)
    // Fallback: allow request if Redis fails
    return { allowed: true, remaining: limit }
  }
}
