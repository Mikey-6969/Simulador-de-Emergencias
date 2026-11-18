import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessTicket } from "@/lib/tickets";
import { uploadDiskPath } from "@/lib/uploads";

type Ctx = { params: Promise<{ id: string }> };

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await ctx.params;
  const attachment = await prisma.attachment.findUnique({
    where: { id },
    include: {
      ticket: { select: { id: true, customerId: true, assigneeId: true } },
    },
  });
  if (!attachment) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (!canAccessTicket(session.role, session.id, attachment.ticket)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  try {
    const diskPath = uploadDiskPath(attachment.fileUrl);
    const bytes = await readFile(diskPath);
    const ext = attachment.fileUrl.split(".").pop()?.toLowerCase() || "jpg";
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": MIME[ext] || "application/octet-stream",
        "Content-Disposition": `inline; filename="${attachment.fileName.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Archivo no disponible" }, { status: 404 });
  }
}
