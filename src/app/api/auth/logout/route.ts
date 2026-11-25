import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";

export async function POST(req: Request) {
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  await destroySession();
  return NextResponse.json({ ok: true });
}
