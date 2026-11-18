import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";

const MAX_IMAGES = 4;
const MAX_BYTES = 2_500_000;

export async function saveTicketImages(
  ticketId: string,
  uploadedBy: string,
  images: Array<{ fileName: string; dataUrl: string }>,
) {
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });

  const saved: Array<{ id: string; fileUrl: string; fileName: string }> = [];

  for (const image of images.slice(0, MAX_IMAGES)) {
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(image.dataUrl);
    if (!match) continue;
    const ext = match[1].split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    const buffer = Buffer.from(match[2], "base64");
    if (!buffer.length || buffer.length > MAX_BYTES) continue;

    const raw = image.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "evidencia";
    const safeBase = raw.replace(/\.[a-zA-Z0-9]+$/, "") || "evidencia";
    const fileName = `${ticketId}-${Date.now()}-${safeBase}.${ext}`;
    const diskPath = path.join(dir, fileName);
    await writeFile(diskPath, buffer);
    const fileUrl = `/uploads/${fileName}`;

    const row = await prisma.attachment.create({
      data: {
        ticketId,
        fileName: image.fileName || fileName,
        fileUrl,
        uploadedBy,
      },
    });
    saved.push({ id: row.id, fileUrl, fileName: row.fileName });
  }

  return saved;
}
