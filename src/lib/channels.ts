import nodemailer from "nodemailer";

export type CaseInfo = {
  number: string;
  title: string;
  status: string;
  priority: string;
  serviceType: string;
  zone: string;
  assigneeName?: string | null;
  assigneePhone?: string | null;
  customerName?: string | null;
  recommendation?: string | null;
  nextVisit?: string | null;
  closureSummary?: string | null;
};

export type MessageInput = {
  recipientName: string;
  title: string;
  body: string;
  caso?: CaseInfo | null;
  baseUrl?: string;
};

const STATUS_LABEL: Record<string, string> = {
  NUEVA: "Nueva",
  EN_ANALISIS_IA: "En análisis IA",
  DIAGNOSTICO_REMOTO: "Diagnóstico remoto",
  PENDIENTE_ESCALAMIENTO: "Pendiente de escalamiento",
  ESCALADA: "Escalada a visita",
  ASIGNADA: "Técnico asignado",
  VISITA_PROGRAMADA: "Visita programada",
  EN_ATENCION: "En atención",
  CERRADA: "Cerrada",
  CANCELADA: "Cancelada",
};

export function statusLabel(status: string) {
  return STATUS_LABEL[status] ?? status;
}

export function appBaseUrl() {
  const explicit = process.env.MILA_PUBLIC_URL?.trim();
  return (explicit || "https://mila-mesa-de-ayuda.vercel.app").replace(/\/$/, "");
}

export function normalizePhone(raw: string | null | undefined) {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10 && digits.startsWith("3")) return `57${digits}`;
  if (digits.length === 12 && digits.startsWith("57")) return digits;
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return null;
}

function caseLines(caso: CaseInfo) {
  const lines = [
    `Caso: ${caso.number}`,
    `Asunto: ${caso.title}`,
    `Estado: ${statusLabel(caso.status)}`,
    `Prioridad: ${caso.priority}`,
    `Servicio: ${caso.serviceType} · Zona: ${caso.zone}`,
  ];
  if (caso.assigneeName) {
    lines.push(
      `Técnico: ${caso.assigneeName}${caso.assigneePhone ? ` (${caso.assigneePhone})` : ""}`,
    );
  }
  if (caso.nextVisit) lines.push(`Próxima visita: ${caso.nextVisit}`);
  if (caso.recommendation) lines.push(`Respuesta / recomendación: ${caso.recommendation}`);
  if (caso.closureSummary) lines.push(`Solución aplicada: ${caso.closureSummary}`);
  return lines;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderEmail(input: MessageInput) {
  const link = input.caso ? `${input.baseUrl ?? appBaseUrl()}/login` : null;
  const lines = input.caso ? caseLines(input.caso) : [];
  const text = [
    `Hola ${input.recipientName},`,
    "",
    input.body,
    "",
    ...lines,
    ...(link ? ["", `Consulta tu caso en MILA: ${link}`] : []),
    "",
    "— MILA · Mesa Inteligente de Logística y Atención",
  ].join("\n");

  const rows = lines
    .map((l) => {
      const idx = l.indexOf(":");
      return `<tr><td style="padding:6px 12px;color:#5b6b7c;white-space:nowrap">${escapeHtml(l.slice(0, idx))}</td><td style="padding:6px 12px;color:#121a24">${escapeHtml(l.slice(idx + 1).trim())}</td></tr>`;
    })
    .join("");
  const html = `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #d7dee7;border-radius:10px;overflow:hidden">
<div style="background:#0f766e;color:#fff;padding:16px 20px"><strong style="font-size:18px">MILA</strong><div style="font-size:12px;opacity:.85">Mesa Inteligente de Logística y Atención</div></div>
<div style="padding:20px">
<p style="margin:0 0 6px;color:#121a24">Hola ${escapeHtml(input.recipientName)},</p>
<h2 style="margin:8px 0 12px;font-size:17px;color:#0f766e">${escapeHtml(input.title)}</h2>
<p style="margin:0 0 14px;color:#121a24;line-height:1.5">${escapeHtml(input.body)}</p>
${rows ? `<table style="border-collapse:collapse;width:100%;background:#f5f8fa;border-radius:8px;font-size:14px">${rows}</table>` : ""}
${link ? `<p style="margin:18px 0 0"><a href="${link}" style="background:#0f766e;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;font-size:14px">Ver mi caso en MILA</a></p>` : ""}
</div></div>`;
  return { subject: `[MILA] ${input.title}${input.caso ? ` · ${input.caso.number}` : ""}`, text, html };
}

export function renderWhatsApp(input: MessageInput) {
  const lines = input.caso ? caseLines(input.caso) : [];
  return [
    `*MILA* · ${input.title}`,
    `Hola ${input.recipientName}, ${input.body}`,
    ...(lines.length ? ["", ...lines] : []),
    ...(input.caso ? ["", `Ver caso: ${input.baseUrl ?? appBaseUrl()}/login`] : []),
  ].join("\n");
}

export function whatsappClickToChatUrl(phone: string, text: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim() && process.env.SMTP_PASS);
}

export function whatsappConfigured() {
  return Boolean(process.env.WHATSAPP_TOKEN?.trim() && process.env.WHATSAPP_PHONE_ID?.trim());
}

export async function sendSmtp(to: string, msg: { subject: string; text: string; html: string }) {
  const port = Number(process.env.SMTP_PORT ?? 587);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 8000,
    socketTimeout: 10000,
  });
  const from = process.env.SMTP_FROM?.trim() || `MILA <${process.env.SMTP_USER}>`;
  const info = await transporter.sendMail({ from, to, ...msg });
  return `SMTP ${info.messageId ?? "ok"}`;
}

export async function sendWhatsAppCloud(phone: string, text: string) {
  const version = process.env.WHATSAPP_API_VERSION?.trim() || "v21.0";
  const template = process.env.WHATSAPP_TEMPLATE?.trim();
  const payload = template
    ? {
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: template,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG?.trim() || "es" },
          components: [
            { type: "body", parameters: [{ type: "text", text: text.slice(0, 900) }] },
          ],
        },
      }
    : { messaging_product: "whatsapp", to: phone, type: "text", text: { body: text.slice(0, 3800) } };
  const res = await fetch(
    `https://graph.facebook.com/${version}/${process.env.WHATSAPP_PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    },
  );
  const body = await res.text();
  if (!res.ok) throw new Error(`WhatsApp HTTP ${res.status}: ${body.slice(0, 300)}`);
  return `WhatsApp ${body.slice(0, 200)}`;
}
