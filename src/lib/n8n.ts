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
]);

function sanitizePayload(payload: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!SAFE_KEYS.has(key)) continue;
    if (typeof value === "string") out[key] = value.slice(0, 120);
    else if (typeof value === "number" || typeof value === "boolean") out[key] = value;
  }
  return out;
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

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flow, ...safe, emittedAt: new Date().toISOString() }),
    });
    const text = await res.text();
    await prisma.automationLog.create({
      data: {
        flow,
        success: res.ok,
        payload: jsonPayload,
        response: text.slice(0, 4000),
        error: res.ok ? null : `HTTP ${res.status}`,
      },
    });
    return { ok: res.ok, skipped: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "n8n error";
    await prisma.automationLog.create({
      data: { flow, success: false, payload: jsonPayload, error: message },
    });
    return { ok: false, skipped: false, error: message };
  }
}
