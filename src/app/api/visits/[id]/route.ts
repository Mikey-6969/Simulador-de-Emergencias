import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";
import { updateVisit } from "@/lib/tickets";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("cancel"), reason: z.string().max(300).optional() }),
  z.object({
    action: z.literal("reschedule"),
    scheduledAt: z.string().min(8),
    windowMinutes: z.number().int().min(30).max(480).optional(),
  }),
]);

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!["COORDINADOR", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  try {
    if (parsed.data.action === "cancel") {
      const result = await updateVisit({
        visitId: id,
        actorId: session.id,
        action: "cancel",
        reason: parsed.data.reason,
      });
      return NextResponse.json(result);
    }
    const scheduledAt = new Date(parsed.data.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      return NextResponse.json({ error: "Fecha/hora inválida" }, { status: 400 });
    }
    const result = await updateVisit({
      visitId: id,
      actorId: session.id,
      action: "reschedule",
      scheduledAt,
      windowMinutes: parsed.data.windowMinutes,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
