import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Edge runtime for middleware
export const config = {
  matcher: "/api/:path*",
};

// Initialize Redis and rate limiter only if credentials are available
let ratelimit: Ratelimit | null = null;
let expensiveRatelimit: Ratelimit | null = null;

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (UPSTASH_URL && UPSTASH_TOKEN) {
  const redis = new Redis({
    url: UPSTASH_URL,
    token: UPSTASH_TOKEN,
  });

  // Standard rate limit: 10 requests per minute per IP
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    analytics: true,
    prefix: "cpa:ratelimit:standard",
  });

  // Expensive operations rate limit: 5 requests per minute per IP
  expensiveRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    analytics: true,
    prefix: "cpa:ratelimit:expensive",
  });
}

// Paths that are considered expensive (AI API calls)
const EXPENSIVE_PATHS = [
  "/api/test-prompt",
  "/api/generate-structure",
  "/api/generate-prompts",
  "/api/council/stream",
  "/api/council/evaluate",
  "/api/council/synthesize",
];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 1. Add security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // 2. Check request size (100KB limit)
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > 100 * 1024) {
    return NextResponse.json(
      {
        error: "Request too large",
        message: "Request body must be less than 100KB",
        maxSize: "100KB",
      },
      { status: 413 }
    );
  }

  // 3. Skip rate limiting if Upstash is not configured (development mode)
  if (!ratelimit || !expensiveRatelimit) {
    // Log warning in development
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Middleware] Upstash not configured, skipping rate limiting"
      );
    }
    return response;
  }

  // 4. Get client IP for rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  // 5. Determine if this is an expensive operation
  const pathname = request.nextUrl.pathname;
  const isExpensiveOperation = EXPENSIVE_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  // 6. Apply appropriate rate limit
  const limiter = isExpensiveOperation ? expensiveRatelimit : ratelimit;
  const limitKey = isExpensiveOperation ? `expensive:${ip}` : `standard:${ip}`;

  try {
    const { success, limit, remaining, reset } = await limiter.limit(limitKey);

    // Add rate limit headers
    response.headers.set("X-RateLimit-Limit", limit.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", reset.toString());

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: "Too many requests",
          message: isExpensiveOperation
            ? "AI operation rate limit exceeded. Please wait before trying again."
            : "Rate limit exceeded. Please slow down your requests.",
          retryAfter,
          limit,
          remaining: 0,
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": reset.toString(),
          },
        }
      );
    }
  } catch (error) {
    // If rate limiting fails, allow the request but log the error
    console.error("[Middleware] Rate limiting error:", error);
  }

  return response;
}
