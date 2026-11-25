import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";

let bootstrapped = false;

/**
 * Creates at most one admin from secrets when none exists.
 * Does not seed demo catalogs or bundled passwords.
 */
export async function ensureBootstrapAdmin() {
  if (bootstrapped) return;
  bootstrapped = true;

  const email = process.env.MILA_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.MILA_ADMIN_PASSWORD?.trim();
  if (!email || !password) return;
  if (password.length < 10) return;

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
