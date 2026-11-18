import { NextResponse } from "next/server";
import { z } from "zod";
import { TicketStatus } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessTicket, changeTicketStatus } from "@/lib/tickets";

const schema = z.object({
  status: z.enum([
    "NUEVA",
    "EN_ANALISIS_IA",
    "DIAGNOSTICO_REMOTO",
    "PENDIENTE_ESCALAMIENTO",
    "ESCALADA",
    "ASIGNADA",
    "VISITA_PROGRAMADA",
    "EN_ATENCION",
    "CERRADA",
    "CANCELADA",
  ]),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!["COORDINADOR", "ADMIN", "TECNICO"].includes(session.role)) {
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
  if (!parsed.success) return NextResponse.json({ error: "Estado inválido" }, { status: 400 });

  const ticket = await changeTicketStatus(id, parsed.data.status as TicketStatus, session.id);
  return NextResponse.json({ ticket });
}
