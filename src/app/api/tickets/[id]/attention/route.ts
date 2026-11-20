import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";
import { startAttention } from "@/lib/tickets";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.role !== "TECNICO" && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const { id } = await ctx.params;
  try {
    const ticket = await startAttention(id, session.id);
    return NextResponse.json({ ticket });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo iniciar atención";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
