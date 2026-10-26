export type Tier = "in_band" | "sigma1" | "sigma2" | "sigma3";

export type BandAction = "none" | "log" | "diagnose" | "propose";

export type BandAssessment = {
  mean: number;
  stdev: number;
  latest: number;
  z: number;
  tier: Tier;
  action: BandAction;
  rule: string;
  upper: { sigma1: number; sigma2: number; sigma3: number };
};

const ACTION: Record<Tier, BandAction> = {
  in_band: "none",
  sigma1: "log",
  sigma2: "diagnose",
  sigma3: "propose",
};

/** Thirty points before the 21:40 checkout deploy. Stable enough to call a baseline. */
export const BASELINE_5XX = [
  0.7, 0.92, 1.14, 0.99, 1.16, 0.97, 1.1, 0.86, 0.95, 1.03, 0.76, 0.84, 0.58,
  0.7, 0.48, 0.64, 0.82, 0.67, 0.89, 0.76, 0.98, 0.84, 1.04, 1.22, 1.02, 1.15,
  0.9, 0.99, 0.72, 0.8,
];

/** The four readings after the deploy. The ramp crosses 3σ. */
export const BREACH_5XX = [...BASELINE_5XX, 1.35, 1.9, 2.5, 3.2];

/** Same service after the rehearsed rollback. */
export const RECOVERED_5XX = [...BASELINE_5XX, 0.9, 0.86, 0.91, 0.84];

export const BASELINE_COUNT = BASELINE_5XX.length;

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sampleStdev(values: number[], avg: number): number {
  const variance =
    values.reduce((sum, value) => sum + (value - avg) ** 2, 0) /
    (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Detection stays deterministic. The baseline window is the rolling history.
 * Western Electric rules on the points after that window decide the tier.
 * A single quiet blip does not page anyone. One point past 3σ does.
 */
export function assessBands(
  series: number[],
  baselineCount = BASELINE_COUNT,
): BandAssessment {
  if (baselineCount < 2) {
    throw new Error("La base necesita al menos dos puntos.");
  }
  if (series.length < baselineCount + 1) {
    throw new Error("Hace falta al menos un punto después de la base.");
  }

  const baseline = series.slice(0, baselineCount);
  const recent = series.slice(baselineCount);
  const avg = mean(baseline);
  const sd = sampleStdev(baseline, avg);
  const latest = series[series.length - 1] ?? avg;

  const upper = {
    sigma1: avg + sd,
    sigma2: avg + 2 * sd,
    sigma3: avg + 3 * sd,
  };

  if (sd === 0) {
    const drifted = recent.some((value) => value !== avg);
    return {
      mean: avg,
      stdev: sd,
      latest,
      z: drifted ? Number.POSITIVE_INFINITY : 0,
      tier: drifted ? "sigma3" : "in_band",
      action: drifted ? "propose" : "none",
      rule: drifted
        ? "La base no varía y apareció un punto distinto. Se trata como 3σ."
        : "Dentro de la banda. La base es plana y el punto nuevo no se movió.",
      upper,
    };
  }

  const zScores = recent.map((value) => (value - avg) / sd);
  const z = (latest - avg) / sd;

  let tier: Tier = "in_band";
  let rule =
    "Dentro de la banda. Ninguna regla de Western Electric se dispara.";

  const last8 = zScores.slice(-8);
  if (last8.length >= 8 && last8.every((score) => score > 0)) {
    tier = "sigma1";
    rule =
      "Ocho puntos seguidos del mismo lado de la media. Deriva lenta: solo se registra.";
  } else if (last8.length >= 8 && last8.every((score) => score < 0)) {
    tier = "sigma1";
    rule =
      "Ocho puntos seguidos bajo la media. Deriva lenta: solo se registra.";
  }

  const last5 = zScores.slice(-5);
  if (last5.length >= 5) {
    const above = last5.filter((score) => score > 1).length;
    const below = last5.filter((score) => score < -1).length;
    if (above >= 4 || below >= 4) {
      tier = "sigma1";
      rule =
        "Cuatro de los últimos cinco puntos superan 1σ del mismo lado. Solo se registra.";
    }
  }

  const last3 = zScores.slice(-3);
  if (last3.length >= 3) {
    const above = last3.filter((score) => score > 2).length;
    const below = last3.filter((score) => score < -2).length;
    if (above >= 2 || below >= 2) {
      tier = "sigma2";
      rule =
        "Dos de los últimos tres puntos superan 2σ. Toca diagnóstico de solo lectura.";
    }
  }

  if (zScores.some((score) => Math.abs(score) > 3)) {
    tier = "sigma3";
    rule =
      "Un punto supera 3σ. Se puede proponer un pull request o el runbook de rollback.";
  }

  return {
    mean: avg,
    stdev: sd,
    latest,
    z,
    tier,
    action: ACTION[tier],
    rule,
    upper,
  };
}
