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
