import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { analyzeTicket } from "@/lib/ai";
import { allowRateLimit, assertSameOrigin } from "@/lib/security";

const schema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  serviceType: z.string().min(2),
});

function toSteps(recommendations: string): string[] {
  return recommendations
    .split(/\n+/)
    .map((line) => line.replace(/^\d+[\).:-]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 4);
}

export async function POST(req: Request) {
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!["CLIENTE", "ADMIN", "COORDINADOR"].includes(session.role)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }
  if (!allowRateLimit(`diagnose:${session.id}`, 8, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Demasiados diagnósticos. Espera unos minutos." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const ai = await analyzeTicket(parsed.data);
  const steps = toSteps(ai.recommendations);
  while (steps.length < 4) {
    steps.push("Documenta con una foto el estado actual y verifica si el problema sigue igual.");
  }

  return NextResponse.json({
    problemSummary: ai.problemSummary,
    ambiguities: ai.ambiguities,
    steps: steps.slice(0, 4),
    suggestedPriority: ai.suggestedPriority,
    confidence: ai.confidence,
    maxAttempts: 4,
  });
}
