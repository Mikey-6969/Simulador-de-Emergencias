import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";
import { reviewAiAnalysis } from "@/lib/tickets";

const schema = z.object({
  decision: z.enum(["ACEPTADO", "MODIFICADO", "RECHAZADO"]),
  notes: z.string().max(2000).optional(),
  applyPriority: z.boolean().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!["COORDINADOR", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Decisión inválida" }, { status: 400 });
  }

  try {
    const analysis = await reviewAiAnalysis({
      analysisId: id,
      actorId: session.id,
      decision: parsed.data.decision,
      notes: parsed.data.notes,
      applyPriority: parsed.data.applyPriority,
    });
    return NextResponse.json({ analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo revisar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
