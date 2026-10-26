import type { BandAssessment, Tier } from "@/lib/bands";

const TIER_LABEL: Record<Tier, string> = {
  in_band: "En banda",
  sigma1: "1σ · registrar",
  sigma2: "2σ · diagnosticar",
  sigma3: "3σ · proponer",
};

const ACTION_LABEL = {
  none: "ninguna",
  log: "registrar",
  diagnose: "diagnosticar",
  propose: "proponer",
} as const;

export function tierLabel(tier: Tier): string {
  return TIER_LABEL[tier];
}

export function actionLabel(action: keyof typeof ACTION_LABEL): string {
  return ACTION_LABEL[action];
}

export function points(value: number): string {
  if (!Number.isFinite(value)) return "∞";
  return value.toFixed(2);
}

export function rate(value: number): string {
  return `${points(value)}%`;
}

export function toneFor(reading: BandAssessment): "alert" | "pine" | "amber" {
  if (reading.tier === "sigma3") return "alert";
  if (reading.tier === "in_band") return "pine";
  return "amber";
}
