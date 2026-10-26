import { describe, expect, it } from "vitest";
import {
  ACME,
  FIX_TEST_PATH,
  NORTHWIND,
  PriceCache,
  TEST_STAMP,
  cacheKey,
  crossTenantCheckout,
  guardFixEdit,
  runIsolationTest,
  stamp,
} from "./checkout-cache";

describe("checkout cache", () => {
  it("drops the tenant and serves acme's price to northwind", () => {
    const result = crossTenantCheckout(false);
    expect(result.status).toBe(500);
    expect(result.cacheKey).toBe("cable-hdmi");
    expect(result.servedTenantId).toBe("acme");
    expect(result.priceCents).toBeNull();
  });

  it("keeps each tenant on their own key", () => {
    const result = crossTenantCheckout(true);
    expect(result.status).toBe(200);
    expect(result.cacheKey).toBe("northwind:cable-hdmi");
    expect(result.servedTenantId).toBe("northwind");
    expect(result.priceCents).toBe(NORTHWIND.cents);
  });

  it("still hits the cache for the same tenant", () => {
    const cache = new PriceCache();
    cache.checkout(ACME, true);
    const again = cache.checkout(ACME, true);
    expect(again.status).toBe(200);
    expect(again.priceCents).toBe(ACME.cents);
    expect(cacheKey(ACME.tenantId, ACME.sku, true)).toBe("acme:cable-hdmi");
  });
});

describe("guardFixEdit", () => {
  it("blocks a fix that rewrites the test", () => {
    const guard = guardFixEdit(FIX_TEST_PATH, "fix");
    expect(guard.allowed).toBe(false);
    expect(guard.exitCode).toBe(2);
  });

  it("allows the fix to edit the cache key", () => {
    const guard = guardFixEdit("lib/checkout-cache.ts", "fix");
    expect(guard.allowed).toBe(true);
    expect(guard.exitCode).toBe(0);
  });

  it("allows a feature task to add a test", () => {
    const guard = guardFixEdit("lib/checkout-cache.test.ts", "feature");
    expect(guard.allowed).toBe(true);
  });

  it("keeps a stable stamp for the exhibit test", () => {
    expect(stamp("mismo")).toBe(stamp("mismo"));
    expect(TEST_STAMP).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe("runIsolationTest", () => {
  it("fails while the key drops the tenant", () => {
    const run = runIsolationTest(false);
    expect(run.pass).toBe(false);
    expect(run.actual).toBe("500 · cable-hdmi");
  });

  it("passes once the key includes the tenant", () => {
    const run = runIsolationTest(true);
    expect(run.pass).toBe(true);
    expect(run.actual).toBe("200 · northwind:cable-hdmi");
  });
});
