import { describe, expect, it } from "vitest";
import { productionGate } from "./production-gate";

describe("productionGate", () => {
  it("blocks a production deploy with no release authorization", () => {
    const result = productionGate("deploy production");
    expect(result.exitCode).toBe(2);
    expect(result.message).toMatch(/código 2/);
  });

  it("allows production after a named release manager signs", () => {
    const result = productionGate("deploy production", "RM-R-MEHTA");
    expect(result.exitCode).toBe(0);
    expect(result.message).toMatch(/RM-R-MEHTA/);
    expect(result.message).toMatch(/code owner/);
  });

  it("ignores commands that are not a production deploy", () => {
    expect(productionGate("make test").exitCode).toBe(0);
  });
});
