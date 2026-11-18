import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessTicket, escalateTicket } from "@/lib/tickets";

const schema = z.object({ reason: z.string().min(8) });
type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!["COORDINADOR", "ADMIN", "CLIENTE"].includes(session.role)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const existing = await prisma.ticket.findUnique({
    where: { id },
    select: { id: true, customerId: true, assigneeId: true },
  });
  if (!existing) return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
  if (!canAccessTicket(session.role, session.id, existing)) {
    return NextResponse.json({ error: "Sin permiso sobre este caso" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Motivo requerido" }, { status: 400 });

  const ticket = await escalateTicket(id, parsed.data.reason, session.id);
  return NextResponse.json({ ticket });
}
