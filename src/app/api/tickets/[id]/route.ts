import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessTicket } from "@/lib/tickets";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id } = await ctx.params;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      assignee: { select: { id: true, name: true, email: true } },
      aiAnalyses: { orderBy: { createdAt: "desc" } },
      escalations: { orderBy: { createdAt: "desc" }, include: { creator: { select: { name: true } } } },
      assignments: {
        orderBy: { createdAt: "desc" },
        include: { technician: { include: { user: { select: { name: true, email: true } } } } },
      },
      timeline: { orderBy: { createdAt: "asc" }, include: { actor: { select: { name: true } } } },
    },
  });

  if (!ticket) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (!canAccessTicket(session.role, session.id, ticket)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  return NextResponse.json({ ticket });
}
