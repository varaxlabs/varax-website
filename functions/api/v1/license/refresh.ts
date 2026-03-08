import Stripe from "stripe";
import type { Env, LicenseMetadata } from "../../../../src/lib/license/types";
import { buildPayload } from "../../../../src/lib/license/payload";
import {
  importSeed,
  importPublicKey,
  signLicenseKey,
  verifyLicenseKey,
} from "../../../../src/lib/crypto/ed25519";
import { bytesToHex } from "../../../../src/lib/crypto/hex";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const json = (headers: HeadersInit = {}) => ({ headers: { "Content-Type": "application/json", ...headers } });

  let body: { key?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, ...json() });
  }

  if (!body.key || typeof body.key !== "string") {
    return new Response(JSON.stringify({ error: "Missing 'key' field" }), { status: 400, ...json() });
  }

  // Verify the existing license key signature
  const publicKey = await importPublicKey(env.ED25519_PUBLIC_KEY);
  const payload = await verifyLicenseKey(publicKey, body.key);
  if (!payload) {
    return new Response(JSON.stringify({ error: "Invalid license key" }), { status: 401, ...json() });
  }

  // Look up license metadata by SHA-256 hash
  const keyHash = bytesToHex(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body.key))
    )
  );

  const metadataRaw = await env.LICENSE_KV.get(`license:${keyHash}`);
  if (!metadataRaw) {
    return new Response(JSON.stringify({ error: "License not found" }), { status: 404, ...json() });
  }

  const metadata: LicenseMetadata = JSON.parse(metadataRaw);

  // Check Stripe subscription is still active
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    httpClient: Stripe.createFetchHttpClient(),
  });

  if (metadata.stripeSubscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(metadata.stripeSubscriptionId);
      if (subscription.status !== "active" && subscription.status !== "trialing") {
        return new Response(JSON.stringify({ error: "Subscription inactive" }), { status: 401, ...json() });
      }
    } catch {
      return new Response(JSON.stringify({ error: "Failed to verify subscription" }), { status: 500, ...json() });
    }
  }

  // Rate limit: 1 refresh per hour
  const rateLimitKey = `ratelimit:refresh:${keyHash}`;
  const rateLimited = await env.LICENSE_KV.get(rateLimitKey);
  if (rateLimited) {
    return new Response(JSON.stringify({ error: "Rate limited — try again later" }), { status: 429, ...json() });
  }

  // Sign a new license key with extended expiry
  const durationDays = metadata.plan.includes("monthly") ? 30 : 365;
  const newPayload = buildPayload(metadata.org, metadata.plan, durationDays);

  const privateKey = await importSeed(env.ED25519_SEED);
  const newKey = await signLicenseKey(privateKey, newPayload);

  // Store new key metadata, remove old
  const newKeyHash = bytesToHex(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(newKey))
    )
  );

  const newMetadata: LicenseMetadata = {
    ...metadata,
    issued: newPayload.issued,
    expires: newPayload.expires,
  };

  await Promise.all([
    env.LICENSE_KV.put(`license:${newKeyHash}`, JSON.stringify(newMetadata)),
    env.LICENSE_KV.delete(`license:${keyHash}`),
    env.LICENSE_KV.put(rateLimitKey, "1", { expirationTtl: 3600 }),
  ]);

  return new Response(JSON.stringify({ key: newKey }), { status: 200, ...json() });
};
