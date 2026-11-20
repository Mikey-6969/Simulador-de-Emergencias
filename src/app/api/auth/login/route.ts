import { NextResponse } from "next/server";
import { z } from "zod";
import { homeForRole, loginWithCredentials } from "@/lib/auth";
import { allowLoginAttempt, assertSameOrigin, clientIp } from "@/lib/security";
import { authSecretStatus, ensureRuntimeReady } from "@/lib/ensure-runtime-ready";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
});

export async function POST(req: Request) {
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;

  const ip = clientIp(req);
  if (!allowLoginAttempt(`login:${ip}`)) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." },
      { status: 429 },
    );
  }

  const secret = authSecretStatus();
  if (!secret.ok) {
    return NextResponse.json(
      {
        error:
          secret.reason === "too_short"
            ? "AUTH_SECRET del servidor es demasiado corto (mín. 16). Configúralo en Secrets de Cursor y vuelve a publicar."
            : "Falta AUTH_SECRET en Secrets de Cursor. Agrégalo, confirma el publish y reintenta el login.",
        code: "AUTH_SECRET_MISSING",
      },
      { status: 503 },
    );
  }

  try {
    await ensureRuntimeReady();

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const user = await loginWithCredentials(parsed.data.email, parsed.data.password);
    if (!user) {
      const hasDemo = Boolean(process.env.MILA_DEMO_PASSWORD?.trim());
      return NextResponse.json(
        {
          error: hasDemo
            ? "Credenciales incorrectas. Usa una cuenta del catálogo con la misma MILA_DEMO_PASSWORD del secret."
            : "Credenciales incorrectas. Configura MILA_ADMIN_* y/o MILA_DEMO_PASSWORD en Secrets, publica, y vuelve a intentar.",
          code: "BAD_CREDENTIALS",
        },
        { status: 401 },
      );
    }

    return NextResponse.json({ user, redirectTo: homeForRole(user.role) });
  } catch (error) {
    console.error("login failed", error);
    const message = error instanceof Error ? error.message : "";
    if (message.includes("AUTH_SECRET")) {
      return NextResponse.json(
        {
          error: "Falta AUTH_SECRET en Secrets de Cursor. Agrégalo y confirma el publish.",
          code: "AUTH_SECRET_MISSING",
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      {
        error: "No se pudo iniciar sesión. Revisa AUTH_SECRET, base de datos y secrets en Cursor.",
        code: "LOGIN_FAILED",
      },
      { status: 500 },
    );
  }
}
