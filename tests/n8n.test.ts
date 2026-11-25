import { describe, expect, it } from "vitest";
import { sanitizePayload, signBody, verifySecret } from "@/lib/n8n";

describe("n8n helpers", () => {
  it("sanitizePayload descarta campos no permitidos (PII) y recorta strings", () => {
    const out = sanitizePayload({
      ticketId: "t1",
      email: "persona@ejemplo.com",
      customerId: "c1",
      reason: "x".repeat(300),
      confidence: 0.7,
      aiViaN8n: true,
      nested: { a: 1 },
    });
    expect(out).toEqual({
      ticketId: "t1",
      reason: "x".repeat(120),
      confidence: 0.7,
      aiViaN8n: true,
    });
  });

  it("signBody es determinista y depende del secreto", () => {
    const a = signBody('{"a":1}', "s1");
    expect(a).toBe(signBody('{"a":1}', "s1"));
    expect(a).not.toBe(signBody('{"a":1}', "s2"));
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("verifySecret compara en tiempo constante y rechaza vacíos", () => {
    expect(verifySecret("abc", "abc")).toBe(true);
    expect(verifySecret("abd", "abc")).toBe(false);
    expect(verifySecret("ab", "abc")).toBe(false);
    expect(verifySecret(null, "abc")).toBe(false);
    expect(verifySecret("abc", undefined)).toBe(false);
  });
});
