import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { retryAutomationLog } from "@/lib/n8n";
import { dispatchExternal } from "@/lib/notify";
import { assertSameOrigin } from "@/lib/security";

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
  const log = await prisma.automationLog.findUnique({ where: { id } });
  if (!log) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
  if (log.success) {
    return NextResponse.json({ error: "El evento ya fue entregado." }, { status: 409 });
  }

  const payload = (log.payload ?? {}) as { notificationId?: string };
  const result =
    log.flow === "notification.external" && payload.notificationId
      ? await dispatchExternal(payload.notificationId)
      : await retryAutomationLog(id);
  if (result.ok && !("skipped" in result && result.skipped)) {
    await prisma.automationLog.update({
      where: { id },
      data: {
        success: true,
        response: `Reintento exitoso por ${session.name} el ${new Date().toISOString()}. Error original: ${log.error ?? "n/d"}`,
      },
    });
  }
  return NextResponse.json({ result });
}
