import { Priority } from "@prisma/client";

export type AiResult = {
  problemSummary: string;
  ambiguities: string;
  recommendations: string;
  suggestedPriority: Priority;
  confidence: number;
  rawResponse: string;
};

function inferPriority(text: string): Priority {
  const t = text.toLowerCase();
  if (/(caído|critico|crítica|incendio|seguridad|ransomware|no enciende|producción)/.test(t)) {
    return "CRITICA";
  }
  if (/(urgente|bloquea|no puedo trabajar|falla total|impresora fiscal)/.test(t)) {
    return "ALTA";
  }
  if (/(lento|intermitente|a veces|molestia)/.test(t)) return "MEDIA";
  return "BAJA";
}

function localDiagnosis(title: string, description: string, serviceType: string): AiResult {
  const blob = `${title}. ${description}. Servicio: ${serviceType}`;
  const ambiguities: string[] = [];
  if (description.trim().split(/\s+/).length < 12) {
    ambiguities.push("La descripción es breve; faltan síntomas concretos, mensajes de error y pasos ya intentados.");
  }
  if (!/(error|mensaje|pantalla|código|hora|desde)/i.test(description)) {
    ambiguities.push("No se indica mensaje de error, momento de inicio ni frecuencia del problema.");
  }
  if (/(y también|además|otro problema|varios)/i.test(description)) {
    ambiguities.push("Parece haber más de un inconveniente en la misma solicitud; conviene separarlos.");
  }

  const recommendations = [
    "1. Reinicie el equipo o servicio afectado y verifique si el problema persiste.",
    "2. Confirme conectividad de red/cable/Wi‑Fi y que otros dispositivos en el sitio funcionan.",
    "3. Anote el mensaje de error exacto (foto) y la hora en que inició el incidente.",
    "4. Si el servicio es crítico para la operación y no hay workaround en 15 minutos, solicite escalamiento a visita.",
  ].join("\n");

  const suggestedPriority = inferPriority(blob);
  const problemSummary = `Posible incidente de ${serviceType.toLowerCase()}: ${title}. Se recomienda intento de diagnóstico remoto antes de programar visita presencial.`;

  return {
    problemSummary,
    ambiguities: ambiguities.join(" ") || "Sin ambigüedades graves detectadas.",
    recommendations,
    suggestedPriority,
    confidence: ambiguities.length ? 0.62 : 0.78,
    rawResponse: JSON.stringify({ engine: "mila-local", title, serviceType }),
  };
}

export async function analyzeTicket(input: {
  title: string;
  description: string;
  serviceType: string;
}): Promise<AiResult> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return localDiagnosis(input.title, input.description, input.serviceType);

  try {
    const prompt = `Eres el agente de diagnóstico remoto de MILA (mesa de ayuda técnica en Bogotá).
Analiza la solicitud y responde SOLO JSON con keys:
problemSummary, ambiguities, recommendations, suggestedPriority (BAJA|MEDIA|ALTA|CRITICA), confidence (0-1).
Título: ${input.title}
Servicio: ${input.serviceType}
Descripción: ${input.description}`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          { role: "system", content: "Responde únicamente JSON válido." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) return localDiagnosis(input.title, input.description, input.serviceType);
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content.replace(/```json|```/g, "").trim());
    return {
      problemSummary: String(parsed.problemSummary ?? ""),
      ambiguities: String(parsed.ambiguities ?? ""),
      recommendations: String(parsed.recommendations ?? ""),
      suggestedPriority: (parsed.suggestedPriority as Priority) || inferPriority(input.description),
      confidence: Number(parsed.confidence ?? 0.7),
      rawResponse: content,
    };
  } catch {
    return localDiagnosis(input.title, input.description, input.serviceType);
  }
}
