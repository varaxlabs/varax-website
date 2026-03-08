import type { LicensePayload } from "./types";
import { PRO_FEATURES, PRO_ANNUAL_FEATURES } from "./types";

export function toRFC3339(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function getFeaturesForPlan(plan: string): string[] {
  switch (plan) {
    case "pro-annual":
      return [...PRO_ANNUAL_FEATURES];
    case "pro-monthly":
      return [...PRO_FEATURES];
    default:
      return [...PRO_FEATURES];
  }
}

export function buildPayload(
  org: string,
  plan: string,
  durationDays: number,
  now?: Date
): LicensePayload {
  const issued = now ?? new Date();
  issued.setMilliseconds(0);
  const expires = new Date(issued.getTime() + durationDays * 24 * 60 * 60 * 1000);

  // Keys must be in alphabetical order for Go compatibility
  return {
    expires: toRFC3339(expires),
    features: getFeaturesForPlan(plan),
    issued: toRFC3339(issued),
    org,
    plan,
  };
}
