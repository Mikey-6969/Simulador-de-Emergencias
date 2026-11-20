import { NextResponse } from "next/server";
import { authSecretStatus, userCount } from "@/lib/ensure-runtime-ready";

/** Public, non-sensitive readiness probe for hosted diagnostics. */
export async function GET() {
  const secret = authSecretStatus();
  let users = -1;
  let dbOk = false;
  try {
    users = await userCount();
    dbOk = true;
  } catch {
    dbOk = false;
  }

  return NextResponse.json({
    ok: secret.ok && dbOk,
    authSecret: secret.ok ? "configured" : secret.reason,
    database: dbOk ? "ok" : "error",
    userCount: dbOk ? users : null,
    demoSeedSecret: process.env.MILA_DEMO_PASSWORD?.trim() ? "configured" : "missing",
    adminBootstrapSecrets:
      process.env.MILA_ADMIN_EMAIL?.trim() && process.env.MILA_ADMIN_PASSWORD?.trim()
        ? "configured"
        : "missing",
  });
}
