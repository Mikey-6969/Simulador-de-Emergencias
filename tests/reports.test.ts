import { describe, expect, it } from "vitest";
import { buildTicketWhere, countBy, parseReportFilters, toCsv } from "@/lib/reports";

describe("filtros de reportes", () => {
  it("acepta solo valores válidos", () => {
    const f = parseReportFilters({
      from: "2026-11-01",
      to: "no-fecha",
      status: "CERRADA",
      zone: "XX",
      priority: "ALTA",
      service: "  Redes / Internet ",
    });
    expect(f).toEqual({
      from: "2026-11-01",
      to: undefined,
      status: "CERRADA",
      zone: undefined,
      priority: "ALTA",
      service: "Redes / Internet",
    });
  });

  it("buildTicketWhere usa día completo en hora de Bogotá", () => {
    const where = buildTicketWhere({ from: "2026-11-01", to: "2026-11-02", zone: "NORTE" });
    const range = where.createdAt as { gte: Date; lt: Date };
    expect(range.gte.toISOString()).toBe("2026-11-01T05:00:00.000Z");
    expect(range.lt.toISOString()).toBe("2026-11-03T05:00:00.000Z");
    expect(where.customerZone).toBe("NORTE");
  });

  it("buildTicketWhere vacío no filtra", () => {
    expect(buildTicketWhere({})).toEqual({});
  });

  it("countBy agrupa", () => {
    const m = countBy(["a", "b", "a"], (x) => x);
    expect(m.get("a")).toBe(2);
    expect(m.get("b")).toBe(1);
  });
});

describe("CSV", () => {
  it("escapa comillas, comas y neutraliza fórmulas", () => {
    const csv = toCsv(["a", "b"], [['hola, "mundo"', "=SUM(A1)"], [null, 3]]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"hola, ""mundo"""');
    expect(csv).toContain("'=SUM(A1)");
    expect(csv).toContain(",3");
  });
});
