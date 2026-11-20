import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertSameOrigin, allowRateLimit, clientIp } from "@/lib/security";

const schema = z.object({
  password: z.string().min(10).max(128),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo administrador" }, { status: 403 });
  }

  if (!allowRateLimit(`admin-pw-reset:${session.id}:${clientIp(req)}`, 40, 60_000)) {
    return NextResponse.json({ error: "Demasiados cambios. Espera un minuto." }, { status: 429 });
  }

  const { id } = await ctx.params;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Contraseña inválida (mín. 10 caracteres)." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true },
  });
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  await prisma.user.update({
    where: { id: target.id },
    data: { passwordHash: await hashPassword(parsed.data.password) },
  });

  return NextResponse.json({
    ok: true,
    userId: target.id,
    email: target.email,
    message: "Contraseña actualizada.",
  });
}
