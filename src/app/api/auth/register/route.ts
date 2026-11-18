import { NextResponse } from "next/server";
import { z } from "zod";
import { Zone } from "@prisma/client";
import { createSession, hashPassword, homeForRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  zone: z.enum(["NORTE", "SUR", "ORIENTE", "OCCIDENTE"]).optional(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "El correo ya está registrado" }, { status: 409 });
  }

  // Public self-registration is client-only. Staff is created by coordinators/admins.
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash: await hashPassword(parsed.data.password),
      role: "CLIENTE",
      zone: (parsed.data.zone as Zone | undefined) ?? null,
    },
  });

  const session = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    zone: user.zone,
  };
  await createSession(session);
  return NextResponse.json({ user: session, redirectTo: homeForRole(user.role) });
}
