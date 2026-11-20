import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";
import { closeTicket } from "@/lib/tickets";

const schema = z.object({
  outcome: z.enum(["RESUELTO", "PENDIENTE", "NUEVA_VISITA", "ESCALADO"]),
  activities: z.string().min(8).max(4000),
  diagnosis: z.string().min(8).max(4000),
  solution: z.string().min(8).max(4000),
});

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
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Completa actividades, diagnóstico, solución y resultado (≥8 caracteres)." },
      { status: 400 },
    );
  }

  try {
    const closure = await closeTicket({
      ticketId: id,
      actorId: session.id,
      ...parsed.data,
    });
    return NextResponse.json({ closure });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo cerrar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
