import { NextResponse } from "next/server";

/**
 * Best-effort in-memory rate limiter.
 *
 * State lives in the module scope, so on serverless/multi-instance deploys it
 * throttles *per warm instance* rather than globally. That still meaningfully
 * blunts brute-force logins and magic-link / OTP email-bombing from a single
 * origin, with zero infra dependency and no way to hard-fail a request. For
 * strict global guarantees, back this with Redis / Upstash Ratelimit and keep
 * the same call sites.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastPrune = Date.now();

function prune(now: number) {
  if (now - lastPrune < 60_000) return;
  lastPrune = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  prune(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export function tooManyRequests(retryAfter: number) {
  return NextResponse.json(
    { error: "Too many attempts. Please wait a moment and try again." },
    {
      status: 429,
      headers: { "Retry-After": String(Math.max(1, retryAfter)) },
    },
  );
}
