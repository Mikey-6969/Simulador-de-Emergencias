import { describe, expect, it } from "vitest";
import { buildExternalPayload } from "@/lib/notify";

describe("notificaciones externas", () => {
  it("arma el payload de correo con asunto y número de caso", () => {
    const p = buildExternalPayload({
      notificationId: "n1",
      recipient: { email: "a@b.co", name: "Ana" },
      title: "Caso cerrado",
      body: "Tu caso quedó cerrado",
      ticketNumber: "MILA-2026-00002",
    });
    expect(p).toMatchObject({
      channel: "email",
      to: "a@b.co",
      subject: "[MILA] Caso cerrado",
      ticketNumber: "MILA-2026-00002",
    });
  });
});

import { normalizePhone, renderEmail, renderWhatsApp, whatsappClickToChatUrl } from "@/lib/channels";

describe("canales de mensajería", () => {
  it("normaliza celulares colombianos al formato internacional", () => {
    expect(normalizePhone("3212777107")).toBe("573212777107");
    expect(normalizePhone("+57 320 699 0305")).toBe("573206990305");
    expect(normalizePhone("123")).toBeNull();
    expect(normalizePhone(null)).toBeNull();
  });

  const caso = {
    number: "MILA-2026-00007",
    title: "Router sin internet",
    status: "ASIGNADA",
    priority: "ALTA",
    serviceType: "Internet",
    zone: "NORTE",
    assigneeName: "Laura Zambrano",
    recommendation: "1. Reinicia el router",
  };

  it("incluye la información del caso en correo y WhatsApp", () => {
    const mail = renderEmail({ recipientName: "Michael", title: "Respuesta", body: "Listo", caso });
    expect(mail.subject).toContain("MILA-2026-00007");
    expect(mail.text).toContain("Técnico asignado");
    expect(mail.html).toContain("Reinicia el router");
    const wa = renderWhatsApp({ recipientName: "Michael", title: "Respuesta", body: "listo", caso });
    expect(wa).toContain("*MILA*");
    expect(wa).toContain("Laura Zambrano");
    expect(whatsappClickToChatUrl("573212777107", wa)).toMatch(/^https:\/\/wa\.me\/573212777107\?text=/);
  });

  it("escapa HTML en el correo", () => {
    const mail = renderEmail({ recipientName: "<b>x</b>", title: "t", body: "<script>", caso: null });
    expect(mail.html).not.toContain("<script>");
  });
});
