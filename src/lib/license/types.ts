export interface Env {
  LICENSE_KV: KVNamespace;
  ED25519_SEED: string;
  ED25519_PUBLIC_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_SECRET_KEY: string;
  RESEND_API_KEY: string;
}

export interface LicensePayload {
  expires: string;
  features: string[];
  issued: string;
  org: string;
  plan: string;
}

export interface LicenseMetadata {
  email: string;
  org: string;
  plan: string;
  issued: string;
  expires: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
}

export const PRO_FEATURES = [
  "reports",
  "evidence",
  "remediation",
  "scheduled-reports",
] as const;

export const PRO_ANNUAL_FEATURES = [
  ...PRO_FEATURES,
  "explore",
] as const;
