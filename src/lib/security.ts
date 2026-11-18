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
  return hosts;
}

function hostMatches(candidate: string, allowed: Set<string>) {
  const host = normalizeHost(candidate);
  if (allowed.has(host)) return true;
  // Cursor/public app hosts may differ from the internal Host header.
  for (const item of allowed) {
    if (host.endsWith(".apps.grok.bot") && item.endsWith(".apps.grok.bot")) return true;
  }
  return false;
}

export function assertSameOrigin(req: Request) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return null;
  }

  // Browser same-origin/same-site fetches (typical app UI -> /api/*).
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite === "same-origin" || fetchSite === "same-site") {
    return null;
  }

  const allowed = allowedHosts(req);
  if (!allowed.size) {
    return NextResponse.json({ error: "Host inválido" }, { status: 403 });
  }

  const origin = req.headers.get("origin");
  if (origin) {
    try {
      if (hostMatches(new URL(origin).host, allowed)) return null;
    } catch {
      return NextResponse.json({ error: "Origen inválido" }, { status: 403 });
    }
    return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  }

  const referer = req.headers.get("referer");
  if (referer) {
    try {
      if (hostMatches(new URL(referer).host, allowed)) return null;
    } catch {
      return NextResponse.json({ error: "Referer inválido" }, { status: 403 });
    }
  }

  return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
}
