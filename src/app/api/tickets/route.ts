import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createTicket } from "@/lib/tickets";

const createSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  serviceType: z.string().min(2),
  customerZone: z.enum(["NORTE", "SUR", "ORIENTE", "OCCIDENTE"]),
  priority: z.enum(["BAJA", "MEDIA", "ALTA", "CRITICA"]).optional(),
  address: z.string().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const where =
    session.role === "CLIENTE"
      ? { customerId: session.id }
      : session.role === "TECNICO"
        ? { assigneeId: session.id }
        : {};

  const tickets = await prisma.ticket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      aiAnalyses: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return NextResponse.json({ tickets });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.role !== "CLIENTE" && session.role !== "ADMIN" && session.role !== "COORDINADOR") {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const customerId =
    session.role === "CLIENTE" ? session.id : session.id; // coordinador puede crear en nombre propio demo

  const ticket = await createTicket({
    customerId,
    ...parsed.data,
  });

  return NextResponse.json({ ticket }, { status: 201 });
}
