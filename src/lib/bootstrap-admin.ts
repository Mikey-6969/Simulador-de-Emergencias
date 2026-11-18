import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureCatalogSeed } from "@/lib/seed-catalog";

let bootstrapped = false;

/** Seeds demo catalog (if configured) and optional first admin. */
export async function ensureBootstrapAdmin() {
  if (bootstrapped) return;
  bootstrapped = true;

  await ensureCatalogSeed();

  const email = process.env.MILA_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.MILA_ADMIN_PASSWORD?.trim();
  if (!email || !password) return;

  const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (existingAdmin) return;

  await prisma.user.create({
    data: {
      email,
      name: "Administrador MILA",
      role: "ADMIN",
      passwordHash: await hashPassword(password),
      active: true,
    },
  });
}
