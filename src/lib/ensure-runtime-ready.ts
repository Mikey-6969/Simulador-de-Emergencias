import { prisma } from "./db";
import { seedDemoCatalog } from "./seed-catalog";
import { ensureBootstrapAdmin } from "./bootstrap-admin";

let ready = false;

/**
 * Ensures auth can work on a fresh hosted DB:
 * 1) bootstrap ADMIN from MILA_ADMIN_* secrets
 * 2) if MILA_DEMO_PASSWORD is set, upsert the demo catalog (idempotent)
 */
export async function ensureRuntimeReady() {
  if (ready) return;
  await ensureBootstrapAdmin();

  const demoPassword = process.env.MILA_DEMO_PASSWORD?.trim();
  if (demoPassword && demoPassword.length >= 10) {
    const sample = await prisma.user.findUnique({
      where: { email: "cliente.oriente.01@mila.app" },
      select: { id: true },
    });
    if (!sample) {
      await seedDemoCatalog();
    }
  }

  ready = true;
}

export function authSecretStatus() {
  const value = process.env.AUTH_SECRET?.trim() || "";
  if (!value) return { ok: false as const, reason: "missing" as const };
  if (value.length < 16) return { ok: false as const, reason: "too_short" as const };
  return { ok: true as const, reason: "ok" as const };
}

export async function userCount() {
  return prisma.user.count();
}
