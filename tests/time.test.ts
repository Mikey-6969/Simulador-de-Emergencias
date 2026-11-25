import { describe, expect, it } from "vitest";
import { addDays, startOfBogotaDay, startOfBogotaWeek } from "@/lib/time";

describe("time (America/Bogota)", () => {
  it("startOfBogotaDay devuelve las 00:00 de Bogotá como instante UTC", () => {
    const d = startOfBogotaDay(new Date("2026-11-25T03:00:00Z"));
    expect(d.toISOString()).toBe("2026-11-24T05:00:00.000Z");
  });

  it("startOfBogotaWeek devuelve el lunes", () => {
    const monday = startOfBogotaWeek(new Date("2026-11-27T15:00:00Z"));
    expect(monday.toISOString()).toBe("2026-11-23T05:00:00.000Z");
  });

  it("addDays suma días completos", () => {
    expect(addDays(new Date("2026-01-01T00:00:00Z"), 3).toISOString()).toBe("2026-01-04T00:00:00.000Z");
  });
});
