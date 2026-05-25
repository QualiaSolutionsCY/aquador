import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

// Check if Upstash is configured
const isConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

// Create Redis client (only if configured)
const redis = isConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Rate limiters for different endpoints
export const rateLimiters = {
  // Checkout: 5 requests per minute
  checkout: isConfigured && redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 m'),
        analytics: true,
        prefix: 'ratelimit:checkout',
      })
    : null,

  // Contact form: 3 requests per minute
  contact: isConfigured && redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, '1 m'),
        analytics: true,
        prefix: 'ratelimit:contact',
      })
    : null,

  // Payment: 5 requests per minute
  payment: isConfigured && redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 m'),
        analytics: true,
        prefix: 'ratelimit:payment',
      })
    : null,

  // Heartbeat: 30 requests per minute
  heartbeat: isConfigured && redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, '1 m'),
        analytics: true,
        prefix: 'ratelimit:heartbeat',
      })
    : null,

  // AI Assistant: 10 requests per minute
  'ai-assistant': isConfigured && redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 m'),
        analytics: true,
        prefix: 'ratelimit:ai-assistant',
      })
    : null,

  // Live chat notify: 3 requests per minute
  'live-chat-notify': isConfigured && redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, '1 m'),
        analytics: true,
        prefix: 'ratelimit:live-chat-notify',
      })
    : null,

  // Email capture: 3 subscribe attempts per minute per IP. Combined with the
  // honeypot field on the form, this raises the cost of mailing-list pollution
  // beyond the gain. RLS on `subscribers` already gates inserts to anon, but
  // the policy is `with_check (email ~ <regex>)` only — no rate limit there.
  'email-capture': isConfigured && redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, '1 m'),
        analytics: true,
        prefix: 'ratelimit:email-capture',
      })
    : null,
};

export type RateLimiterKey = keyof typeof rateLimiters;

const fallbackLimits: Record<RateLimiterKey, { limit: number; windowMs: number }> = {
  checkout: { limit: 5, windowMs: 60_000 },
  contact: { limit: 3, windowMs: 60_000 },
  payment: { limit: 5, windowMs: 60_000 },
  heartbeat: { limit: 30, windowMs: 60_000 },
  'ai-assistant': { limit: 10, windowMs: 60_000 },
  'live-chat-notify': { limit: 3, windowMs: 60_000 },
  'email-capture': { limit: 3, windowMs: 60_000 },
};

const fallbackBuckets = new Map<string, { count: number; reset: number }>();

/**
 * Get client IP from request
 */
function getClientIp(request: NextRequest): string {
  // Try various headers that might contain the real IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback
  return '127.0.0.1';
}

/**
 * Check rate limit for a request
 * Returns null if within limit, or a NextResponse if rate limited
 */
export async function checkRateLimit(
  request: NextRequest,
  limiterKey: RateLimiterKey
): Promise<NextResponse | null> {
  const limiter = rateLimiters[limiterKey];

  if (!limiter) {
    if (process.env.NODE_ENV !== 'production') return null;

    const ip = getClientIp(request);
    const config = fallbackLimits[limiterKey];
    const now = Date.now();
    const bucketKey = `${limiterKey}:${ip}`;
    const bucket = fallbackBuckets.get(bucketKey);

    if (!bucket || bucket.reset <= now) {
      fallbackBuckets.set(bucketKey, { count: 1, reset: now + config.windowMs });
      return null;
    }

    bucket.count += 1;
    if (bucket.count <= config.limit) return null;

    const retryAfter = Math.ceil((bucket.reset - now) / 1000);
    return NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': config.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': bucket.reset.toString(),
          'Retry-After': retryAfter.toString(),
        },
      }
    );
  }

  const ip = getClientIp(request);
  const { success, limit, reset, remaining } = await limiter.limit(ip);

  if (!success) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null;
}
