import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/security";

/** Self-registration disabled: accounts are provisioned by seed / admin. */
export async function POST(req: Request) {
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  return NextResponse.json(
    { error: "El registro público está deshabilitado. Usa una cuenta provisionada." },
    { status: 403 },
  );
}
