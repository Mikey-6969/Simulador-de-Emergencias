import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";
import { runAiPipeline } from "@/lib/tickets";

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
  try {
    const result = await runAiPipeline(id);
    return NextResponse.json({ ok: true, analyzed: !("alreadyAnalyzed" in result) });
  } catch {
    return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
  }
}
