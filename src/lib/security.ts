import { NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };
const rateBuckets = new Map<string, Bucket>();

export function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

/** Returns false when the caller exceeded the limit. */
export function allowRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = rateBuckets.get(key);
  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

export function allowLoginAttempt(key: string, limit = 10, windowMs = 15 * 60 * 1000) {
  return allowRateLimit(key, limit, windowMs);
}

function normalizeHost(value: string) {
  return value.trim().toLowerCase().replace(/:\d+$/, "");
}

function allowedHosts(req: Request) {
  const hosts = new Set<string>();
  const add = (raw?: string | null) => {
    if (!raw) return;
    for (const part of raw.split(",")) {
      const host = normalizeHost(part);
      if (host) hosts.add(host);
    }
  };
  add(req.headers.get("host"));
  add(req.headers.get("x-forwarded-host"));
  add(process.env.APP_HOST);
  add(process.env.NEXT_PUBLIC_APP_HOST);

  const forwarded = req.headers.get("forwarded");
  if (forwarded) {
    for (const segment of forwarded.split(",")) {
      const match = segment.match(/(?:^|;)\s*host=([^;]+)/i);
      if (match?.[1]) add(match[1].replace(/^"|"$/g, ""));
    }
  }
  return hosts;
}

export function assertSameOrigin(req: Request) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return null;
  }

  // Strict same-origin browser fetches (UI -> /api on this app).
  if (req.headers.get("sec-fetch-site") === "same-origin") {
    return null;
  }

  const allowed = allowedHosts(req);
  if (!allowed.size) {
    return NextResponse.json({ error: "Host inválido" }, { status: 403 });
  }

  const origin = req.headers.get("origin");
  if (origin) {
    try {
      if (allowed.has(normalizeHost(new URL(origin).host))) return null;
    } catch {
      return NextResponse.json({ error: "Origen inválido" }, { status: 403 });
    }
    return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  }

  const referer = req.headers.get("referer");
  if (referer) {
    try {
      if (allowed.has(normalizeHost(new URL(referer).host))) return null;
    } catch {
      return NextResponse.json({ error: "Referer inválido" }, { status: 403 });
    }
  }

  return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
}
