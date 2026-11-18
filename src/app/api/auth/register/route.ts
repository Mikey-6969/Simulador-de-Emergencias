import { NextResponse } from "next/server";

/** Self-registration disabled: accounts are provisioned by seed / admin. */
export async function POST() {
  return NextResponse.json(
    { error: "El registro público está deshabilitado. Usa una cuenta provisionada." },
    { status: 403 },
  );
}
