import { describe, expect, it } from "vitest";
import {
  BASELINE_COUNT,
  BREACH_5XX,
  RECOVERED_5XX,
  assessBands,
} from "./bands";

const flatBaseline = [1, 1, 1, 1, 3, 3, 3, 3];

describe("assessBands", () => {
  it("treats the checkout spike as a 3σ proposal", () => {
    const reading = assessBands(BREACH_5XX, BASELINE_COUNT);
    expect(reading.tier).toBe("sigma3");
    expect(reading.action).toBe("propose");
    expect(reading.z).toBeGreaterThan(3);
    expect(reading.latest).toBe(3.2);
    expect(reading.rule).toMatch(/3σ/);
  });

  it("sees the post-rollback series as inside the band", () => {
    const reading = assessBands(RECOVERED_5XX, BASELINE_COUNT);
    expect(reading.tier).toBe("in_band");
    expect(reading.action).toBe("none");
    expect(Math.abs(reading.z)).toBeLessThan(1);
  });

  it("logs a slow drift that never crosses 2σ", () => {
    const reading = assessBands(
      [...flatBaseline, ...Array(8).fill(2.3)],
      flatBaseline.length,
    );
    expect(reading.tier).toBe("sigma1");
    expect(reading.action).toBe("log");
  });

  it("diagnoses two of three points beyond 2σ", () => {
    const reading = assessBands([...flatBaseline, 4.6, 4.6, 2], flatBaseline.length);
    expect(reading.tier).toBe("sigma2");
    expect(reading.action).toBe("diagnose");
    expect(Math.abs(reading.z)).toBeLessThan(3);
  });

  it("lets a 3σ point outrank a milder rule", () => {
    const reading = assessBands([...flatBaseline, 2, 2, 6.5], flatBaseline.length);
    expect(reading.tier).toBe("sigma3");
    expect(reading.action).toBe("propose");
  });

  it("rejects a window that is only baseline", () => {
    expect(() => assessBands([1, 2], 2)).toThrow(/después de la base/);
  });
});
