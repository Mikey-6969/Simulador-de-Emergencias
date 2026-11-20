import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";
import { seedDemoCatalog } from "@/lib/seed-catalog";
import { prisma } from "@/lib/db";

/**
 * ADMIN-only. Seeds/upserts the demo catalog using MILA_DEMO_PASSWORD from
 * server secrets. Never accepts a password in the request body.
 */
export async function POST(req: Request) {
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo administrador" }, { status: 403 });
  }

  if (!process.env.MILA_DEMO_PASSWORD?.trim()) {
    return NextResponse.json(
      {
        error:
          "Configura el secret MILA_DEMO_PASSWORD en Cursor (Publish / Secrets) y vuelve a intentar.",
      },
      { status: 400 },
    );
  }

  try {
    await seedDemoCatalog();
    const total = await prisma.user.count();
    const byRole = await prisma.user.groupBy({
      by: ["role"],
      _count: { _all: true },
    });
    return NextResponse.json({
      ok: true,
      total,
      byRole: Object.fromEntries(byRole.map((r) => [r.role, r._count._all])),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Seed falló";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
