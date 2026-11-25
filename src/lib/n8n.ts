import { createHmac, timingSafeEqual } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "./db";

const SAFE_KEYS = new Set([
  "ticketId",
  "number",
  "status",
  "remoteAttempts",
  "suggestedPriority",
  "confidence",
  "technicianId",
  "technicianName",
  "visitId",
  "scheduledAt",
  "outcome",
  "decision",
  "reason",
  "aiViaN8n",
  "notificationId",
  "channel",
  "title",
]);

export function sanitizePayload(payload: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!SAFE_KEYS.has(key)) continue;
    if (typeof value === "string") out[key] = value.slice(0, 120);
    else if (typeof value === "number" || typeof value === "boolean") out[key] = value;
  }
  return out;
}

export function signBody(body: string, secret: string) {
  return createHmac("sha256", secret).update(body).digest("hex");
}

export function verifySecret(provided: string | null | undefined, expected: string | undefined) {
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function aiViaN8nEnabled() {
  return (
    process.env.AI_VIA_N8N === "true" &&
    Boolean(process.env.N8N_WEBHOOK_URL?.trim()) &&
    Boolean(process.env.N8N_CALLBACK_SECRET?.trim())
  );
}

async function postToN8n(url: string, flow: string, safe: Record<string, unknown>) {
  const body = JSON.stringify({ flow, ...safe, emittedAt: new Date().toISOString() });
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const secret = process.env.N8N_WEBHOOK_SECRET?.trim();
  if (secret) headers["x-mila-signature"] = signBody(body, secret);
  const res = await fetch(url, {
    method: "POST",
    headers,
    body,
    signal: AbortSignal.timeout(8000),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

export async function emitN8nEvent(flow: string, payload: Record<string, unknown>) {
  const url = process.env.N8N_WEBHOOK_URL?.trim();
  const safe = sanitizePayload(payload);
  const jsonPayload = safe as Prisma.InputJsonValue;
  if (!url) {
    await prisma.automationLog.create({
      data: {
        flow,
        success: true,
        payload: jsonPayload,
        response: "N8N_WEBHOOK_URL no configurada; evento registrado localmente.",
      },
    });
    return { ok: true, skipped: true };
  }

  let lastError = "n8n error";
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await postToN8n(url, flow, safe);
      if (result.ok || attempt === 2 || result.status < 500) {
        await prisma.automationLog.create({
          data: {
            flow,
            success: result.ok,
            payload: jsonPayload,
            response: result.text.slice(0, 4000),
            error: result.ok ? null : `HTTP ${result.status}`,
          },
        });
        return { ok: result.ok, skipped: false };
      }
      lastError = `HTTP ${result.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "n8n error";
    }
  }
  await prisma.automationLog.create({
    data: {
      flow,
      success: false,
      payload: jsonPayload,
      error: `${lastError} (tras 2 intentos)`,
    },
  });
  return { ok: false, skipped: false, error: lastError };
}

export async function retryAutomationLog(logId: string) {
  const log = await prisma.automationLog.findUniqueOrThrow({ where: { id: logId } });
  if (log.success) throw new Error("El evento ya fue entregado correctamente.");
  const payload = (log.payload && typeof log.payload === "object" ? log.payload : {}) as Record<
    string,
    unknown
  >;
  return emitN8nEvent(log.flow, { ...payload, retryOf: log.id });
}
