import { Prisma } from "@prisma/client";
import { prisma } from "./db";

export async function emitN8nEvent(flow: string, payload: Record<string, unknown>) {
  const url = process.env.N8N_WEBHOOK_URL?.trim();
  const jsonPayload = payload as Prisma.InputJsonValue;
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
      body: JSON.stringify({ flow, ...payload, emittedAt: new Date().toISOString() }),
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
