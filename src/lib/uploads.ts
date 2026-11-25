import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";

const MAX_IMAGES = 4;
const MAX_BYTES = 2_500_000;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function saveTicketImages(
  ticketId: string,
  uploadedBy: string,
  images: Array<{ fileName: string; dataUrl: string }>,
  options?: { closureId?: string },
) {
  const saved: Array<{ id: string; fileUrl: string; fileName: string }> = [];

  for (const image of images.slice(0, MAX_IMAGES)) {
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(image.dataUrl);
    if (!match) continue;
    const mime = match[1].toLowerCase();
    if (!ALLOWED.has(mime) || mime.includes("svg")) continue;

    const ext = mime.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    const buffer = Buffer.from(match[2], "base64");
    if (!buffer.length || buffer.length > MAX_BYTES) continue;

    const raw = image.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "evidencia";
    const safeBase = raw.replace(/\.[a-zA-Z0-9]+$/, "") || "evidencia";
    const storedName = `${ticketId}-${randomUUID()}-${safeBase}.${ext}`;
    const row = await prisma.attachment.create({
      data: {
        ticketId,
        fileName: image.fileName || storedName,
        // Private authenticated route — bytes live in the database (serverless-safe).
        fileUrl: storedName,
        uploadedBy,
        closureId: options?.closureId,
        mimeType: mime,
        data: buffer,
      },
    });
    saved.push({
      id: row.id,
      fileUrl: `/api/attachments/${row.id}`,
      fileName: row.fileName,
    });
  }

  return saved;
}

export function uploadDiskPath(storedName: string) {
  const base = path.join(process.cwd(), "storage", "uploads");
  const resolved = path.resolve(base, storedName);
  if (!resolved.startsWith(path.resolve(base) + path.sep)) {
    throw new Error("Invalid upload path");
  }
  return resolved;
}
