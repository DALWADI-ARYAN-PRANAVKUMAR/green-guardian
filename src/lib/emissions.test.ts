import { describe, it, expect } from "vitest";
import { computeKg, presetById, PRESETS, DAILY_PARIS_TARGET_KG, DAILY_GLOBAL_AVG_KG } from "./emissions";

describe("emissions", () => {
  it("every preset has positive-or-zero factor and required fields", () => {
    for (const p of PRESETS) {
      expect(p.id).toBeTruthy();
      expect(p.unit).toBeTruthy();
      expect(p.factor).toBeGreaterThanOrEqual(0);
    }
  });

  it("presetById returns the matching preset", () => {
    expect(presetById("car_petrol_km")?.action).toBe("Petrol car");
    expect(presetById("does_not_exist")).toBeUndefined();
  });

  it("computeKg multiplies factor by quantity", () => {
    // 10 km petrol car = 10 * 0.192 = 1.92
    expect(computeKg("car_petrol_km", 10)).toBeCloseTo(1.92, 3);
    // 2 beef meals = 2 * 7 = 14
    expect(computeKg("meal_beef", 2)).toBeCloseTo(14, 3);
  });

  it("computeKg returns 0 for cycling (zero-emission)", () => {
    expect(computeKg("bike_km", 50)).toBe(0);
  });

  it("computeKg returns 0 for unknown preset (does not throw)", () => {
    expect(computeKg("ghost", 999)).toBe(0);
  });

  it("benchmarks are sane (Paris target below global average)", () => {
    expect(DAILY_PARIS_TARGET_KG).toBeLessThan(DAILY_GLOBAL_AVG_KG);
    expect(DAILY_PARIS_TARGET_KG).toBeGreaterThan(0);
  });
});
