import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifySecret } from "@/lib/n8n";
import { allowRateLimit, clientIp } from "@/lib/security";
import { runAiPipeline } from "@/lib/tickets";

const schema = z.object({ ticketId: z.string().min(1) });

export async function POST(req: Request) {
  if (!allowRateLimit(`ai-analyze:${clientIp(req)}`, 60, 60_000)) {
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
  }
  const expected = process.env.N8N_CALLBACK_SECRET?.trim();
  if (!expected) {
    return NextResponse.json({ error: "N8N_CALLBACK_SECRET no configurado" }, { status: 503 });
  }
  if (!verifySecret(req.headers.get("x-mila-secret"), expected)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "ticketId requerido" }, { status: 400 });

  const exists = await prisma.ticket.findUnique({
    where: { id: parsed.data.ticketId },
    select: { id: true },
  });
  if (!exists) return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });

  const result = await runAiPipeline(parsed.data.ticketId);
  return NextResponse.json({
    ok: true,
    analyzed: !("alreadyAnalyzed" in result),
    status: result.status,
  });
}
