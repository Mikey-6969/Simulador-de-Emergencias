import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
    note: "Sin hashes ni secretos. Contraseñas solo vía secrets de entorno / seed.",
  });
}
