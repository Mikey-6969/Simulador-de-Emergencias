import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!["COORDINADOR", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const technicians = await prisma.technicianProfile.findMany({
    include: { user: { select: { id: true, name: true, email: true, zone: true, active: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ technicians });
}

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  zones: z.array(z.enum(["NORTE", "SUR", "ORIENTE", "OCCIDENTE"])).min(1),
  skills: z.array(z.string()).min(1),
  capacityPerDay: z.number().int().min(1).max(12).default(4),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!["COORDINADOR", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const email = parsed.data.email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) {
    return NextResponse.json({ error: "El correo ya existe" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      role: "TECNICO",
      passwordHash: await hashPassword(parsed.data.password),
      zone: parsed.data.zones[0],
    },
  });

  const profile = await prisma.technicianProfile.create({
    data: {
      userId: user.id,
      zones: parsed.data.zones,
      skills: parsed.data.skills,
      capacityPerDay: parsed.data.capacityPerDay,
      available: true,
    },
  });

  return NextResponse.json(
    {
      technician: {
        id: profile.id,
        zones: profile.zones,
        skills: profile.skills,
        capacityPerDay: profile.capacityPerDay,
        available: profile.available,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          zone: user.zone,
        },
      },
    },
    { status: 201 },
  );
}
