import { NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };
const loginBuckets = new Map<string, Bucket>();

export function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

/** Returns false when the caller exceeded the limit. */
export function allowLoginAttempt(key: string, limit = 10, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const current = loginBuckets.get(key);
  if (!current || current.resetAt <= now) {
    loginBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

export function assertSameOrigin(req: Request) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return null;
  }

  const host = req.headers.get("host");
  if (!host) {
    return NextResponse.json({ error: "Host inválido" }, { status: 403 });
  }

  const origin = req.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host === host) return null;
    } catch {
      return NextResponse.json({ error: "Origen inválido" }, { status: 403 });
    }
    return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  }

  const referer = req.headers.get("referer");
  if (referer) {
    try {
      if (new URL(referer).host === host) return null;
    } catch {
      return NextResponse.json({ error: "Referer inválido" }, { status: 403 });
    }
  }

  return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
}
