import { NextResponse } from "next/server";
import { z } from "zod";
import { homeForRole, loginWithCredentials } from "@/lib/auth";
import { ensureBootstrapAdmin } from "@/lib/bootstrap-admin";
import { allowLoginAttempt, assertSameOrigin, clientIp } from "@/lib/security";

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

  try {
    await ensureBootstrapAdmin();

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const user = await loginWithCredentials(parsed.data.email, parsed.data.password);
    if (!user) {
      return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
    }

    return NextResponse.json({ user, redirectTo: homeForRole(user.role) });
  } catch (error) {
    console.error("login failed", error);
    return NextResponse.json(
      { error: "No se pudo iniciar sesión. Revisa la configuración del servidor." },
      { status: 500 },
    );
  }
}
