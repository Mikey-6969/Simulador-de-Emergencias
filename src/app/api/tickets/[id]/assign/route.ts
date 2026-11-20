import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { assignTechnician } from "@/lib/tickets";
import { assertSameOrigin } from "@/lib/security";

const schema = z.object({ technicianProfileId: z.string().min(1) });
type Ctx = { params: Promise<{ id: string }> };

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
    return NextResponse.json({ error: "Técnico requerido" }, { status: 400 });
  }

  const ticket = await assignTechnician(id, parsed.data.technicianProfileId, session.id);
  return NextResponse.json({ ticket });
}
