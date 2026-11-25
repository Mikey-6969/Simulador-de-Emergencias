import { describe, expect, it } from "vitest";
import {
  computeTicketMetrics,
  formatMinutes,
  summarizeMetrics,
} from "@/lib/metrics";

const t0 = new Date("2026-11-20T10:00:00Z");
const at = (min: number) => new Date(t0.getTime() + min * 60_000);

describe("métricas de tiempos", () => {
  it("calcula primera atención, asignación y resolución", () => {
    const m = computeTicketMetrics({
      createdAt: t0,
      closedAt: at(300),
      firstAssignedAt: at(90),
      events: [
        { type: "CREATED", createdAt: t0 },
        { type: "AI_ANALYSIS", createdAt: at(1) },
        { type: "ESCALATED", createdAt: at(45) },
        { type: "ASSIGNED", createdAt: at(90) },
      ],
    });
    expect(m).toEqual({ firstAttentionMin: 45, assignmentMin: 90, resolutionMin: 300 });
  });

  it("devuelve null cuando aún no hay hitos", () => {
    const m = computeTicketMetrics({
      createdAt: t0,
      closedAt: null,
      firstAssignedAt: null,
      events: [{ type: "CREATED", createdAt: t0 }],
    });
    expect(m).toEqual({ firstAttentionMin: null, assignmentMin: null, resolutionMin: null });
  });

  it("summarizeMetrics promedia ignorando nulos y calcula mediana", () => {
    const s = summarizeMetrics([
      { firstAttentionMin: 10, assignmentMin: null, resolutionMin: 60 },
      { firstAttentionMin: 30, assignmentMin: 40, resolutionMin: 120 },
      { firstAttentionMin: null, assignmentMin: 20, resolutionMin: 600 },
    ]);
    expect(s.count).toBe(3);
    expect(s.avgFirstAttentionMin).toBe(20);
    expect(s.avgAssignmentMin).toBe(30);
    expect(s.avgResolutionMin).toBe(260);
    expect(s.medianResolutionMin).toBe(120);
  });

  it("formatMinutes es legible", () => {
    expect(formatMinutes(null)).toBe("—");
    expect(formatMinutes(45)).toBe("45 min");
    expect(formatMinutes(125)).toBe("2 h 5 min");
    expect(formatMinutes(60 * 50)).toBe("2 d 2 h");
  });
});
