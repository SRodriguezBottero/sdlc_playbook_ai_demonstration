export type CheckoutRequest = {
  tenantId: string;
  sku: string;
  cents: number;
};

export type CheckoutResult = {
  status: 200 | 500;
  cacheKey: string;
  priceCents: number | null;
  servedTenantId: string | null;
  reason: string;
};

export type GuardResult = {
  allowed: boolean;
  exitCode: 0 | 2;
  message: string;
};

export const ACME: CheckoutRequest = {
  tenantId: "acme",
  sku: "cable-hdmi",
  cents: 1999,
};

export const NORTHWIND: CheckoutRequest = {
  tenantId: "northwind",
  sku: "cable-hdmi",
  cents: 2499,
};

export const FIX_TEST_PATH = "lib/checkout-cache.test.ts";

export const ISOLATION_TEST_EXHIBIT = `it("aisla el precio por tenant", () => {
  const result = checkout("northwind", "cable-hdmi");
  expect(result.status).toBe(200);
  expect(result.servedTenantId).toBe("northwind");
  expect(result.cacheKey).toBe("northwind:cable-hdmi");
});
`;

export type IsolationRun = {
  pass: boolean;
  expected: string;
  actual: string;
  checkout: CheckoutResult;
};

/** The test QA committed first. It fails while the key drops the tenant. */
export function runIsolationTest(includeTenant: boolean): IsolationRun {
  const checkout = crossTenantCheckout(includeTenant);
  const pass =
    checkout.status === 200 &&
    checkout.servedTenantId === NORTHWIND.tenantId &&
    checkout.cacheKey === `${NORTHWIND.tenantId}:${NORTHWIND.sku}`;

  return {
    pass,
    expected: "200 \u00b7 northwind:cable-hdmi",
    actual: `${checkout.status} \u00b7 ${checkout.cacheKey}`,
    checkout,
  };
}

const TEST_PATH =
  /(?:^|\/)(?:[^/]+\.test\.tsx?|[^/]+\.spec\.tsx?|tests\/.+|evals\/.+)$/;

export function cacheKey(
  tenantId: string,
  sku: string,
  includeTenant: boolean,
): string {
  return includeTenant ? `${tenantId}:${sku}` : sku;
}

export function stamp(source: string): string {
  let hash = 5381;
  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash << 5) + hash + source.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export const TEST_STAMP = stamp(ISOLATION_TEST_EXHIBIT);

export class PriceCache {
  private readonly store = new Map<string, CheckoutRequest>();

  checkout(request: CheckoutRequest, includeTenant: boolean): CheckoutResult {
    const key = cacheKey(request.tenantId, request.sku, includeTenant);
    const hit = this.store.get(key);

    if (!hit) {
      this.store.set(key, request);
      return {
        status: 200,
        cacheKey: key,
        priceCents: request.cents,
        servedTenantId: request.tenantId,
        reason: "Miss de cache. Se guarda el precio de este tenant.",
      };
    }

    if (hit.tenantId !== request.tenantId) {
      return {
        status: 500,
        cacheKey: key,
        priceCents: null,
        servedTenantId: hit.tenantId,
        reason: `La key ${key} le entrega a ${request.tenantId} el precio de ${hit.tenantId}. Checkout corta el cruce.`,
      };
    }

    return {
      status: 200,
      cacheKey: key,
      priceCents: hit.cents,
      servedTenantId: hit.tenantId,
      reason: "Hit de cache del mismo tenant.",
    };
  }
}

/** The bug, then the fix: one function, the boolean is the code under test. */
export function crossTenantCheckout(includeTenant: boolean): CheckoutResult {
  const cache = new PriceCache();
  cache.checkout(ACME, includeTenant);
  return cache.checkout(NORTHWIND, includeTenant);
}

/**
 * During a fix the agent may change production code.
 * It may not rewrite the test that already failed for the right reason.
 */
export function guardFixEdit(path: string, task: "fix" | "feature"): GuardResult {
  if (task === "fix" && TEST_PATH.test(path)) {
    return {
      allowed: false,
      exitCode: 2,
      message:
        "Durante un fix el agente no puede editar el test. El test existía antes del cambio y es la prueba de que el bug se fue.",
    };
  }

  return {
    allowed: true,
    exitCode: 0,
    message: "Edición permitida.",
  };
}
