import { NextResponse } from "next/server";
import { Role, Zone } from "@prisma/client";
import { z } from "zod";
import { getSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertSameOrigin, allowRateLimit, clientIp } from "@/lib/security";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo administrador" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { zone: "asc" }, { email: "asc" }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      zone: true,
      phone: true,
      active: true,
      createdAt: true,
    },
  });

  const counts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    total: users.length,
    counts,
    users,
    note: "Sin hashes ni secretos.",
  });
}

const createSchema = z.object({
  email: z.string().email().max(191),
  name: z.string().min(2).max(191),
  role: z.enum(["CLIENTE", "TECNICO", "COORDINADOR", "ADMIN"]),
  zone: z.enum(["NORTE", "SUR", "ORIENTE", "OCCIDENTE"]).optional().nullable(),
  password: z.string().min(10).max(128),
  phone: z
    .string()
    .regex(/^[0-9+\s()-]{7,20}$/)
    .optional()
    .nullable(),
  active: z.boolean().optional(),
});

export async function POST(req: Request) {
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo administrador" }, { status: 403 });
  }

  if (!allowRateLimit(`admin-user-create:${session.id}:${clientIp(req)}`, 30, 60_000)) {
    return NextResponse.json({ error: "Demasiadas altas. Espera un minuto." }, { status: 429 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos: email, nombre (≥2), rol y contraseña (≥10)." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const role = parsed.data.role as Role;
  const zone = (parsed.data.zone || null) as Zone | null;

  if ((role === "CLIENTE" || role === "TECNICO" || role === "COORDINADOR") && !zone) {
    return NextResponse.json(
      { error: "Zona obligatoria para cliente, técnico o coordinador." },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Ese correo ya existe." }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      email,
      name: parsed.data.name.trim(),
      role,
      zone: role === "ADMIN" ? null : zone,
      phone: parsed.data.phone?.trim() || null,
      passwordHash,
      active: parsed.data.active ?? true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      zone: true,
      phone: true,
      active: true,
      createdAt: true,
    },
  });

  if (role === "TECNICO") {
    await prisma.technicianProfile.create({
      data: {
        userId: user.id,
        zones: zone ? [zone] : [],
        skills: ["general"],
        capacityPerDay: 4,
        available: true,
      },
    });
  }

  return NextResponse.json({ user });
}
