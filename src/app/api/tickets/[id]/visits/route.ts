import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";
import { canAccessTicket, scheduleVisit } from "@/lib/tickets";
import { prisma } from "@/lib/db";

const schema = z.object({
  technicianProfileId: z.string().min(1),
  scheduledAt: z.string().datetime({ offset: true }).or(z.string().min(8)),
  windowMinutes: z.number().int().min(30).max(480).optional(),
  address: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await ctx.params;
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: { id: true, customerId: true, assigneeId: true },
  });
  if (!ticket) return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
  if (!canAccessTicket(session.role, session.id, ticket)) {
    return NextResponse.json({ error: "Sin permiso sobre este caso" }, { status: 403 });
  }

  const visits = await prisma.visit.findMany({
    where: { ticketId: id },
    include: { technician: { include: { user: { select: { name: true } } } } },
    orderBy: { scheduledAt: "asc" },
  });
  return NextResponse.json({ visits });
}

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
    return NextResponse.json({ error: "Datos de visita inválidos" }, { status: 400 });
  }

  const scheduledAt = new Date(parsed.data.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json({ error: "Fecha/hora inválida" }, { status: 400 });
  }

  try {
    const visit = await scheduleVisit({
      ticketId: id,
      technicianProfileId: parsed.data.technicianProfileId,
      scheduledAt,
      windowMinutes: parsed.data.windowMinutes,
      address: parsed.data.address,
      notes: parsed.data.notes,
      actorId: session.id,
    });
    return NextResponse.json({ visit });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo programar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
