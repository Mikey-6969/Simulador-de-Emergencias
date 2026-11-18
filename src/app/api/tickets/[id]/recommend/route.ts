import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { recommendTechnicians } from "@/lib/tickets";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!["COORDINADOR", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const recommendations = await recommendTechnicians(id);
  return NextResponse.json({ recommendations });
}
