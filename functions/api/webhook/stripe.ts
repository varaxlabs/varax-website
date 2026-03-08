import Stripe from "stripe";
import type { Env, LicenseMetadata } from "../../../src/lib/license/types";
import { buildPayload } from "../../../src/lib/license/payload";
import { importSeed, signLicenseKey } from "../../../src/lib/crypto/ed25519";
import { bytesToHex } from "../../../src/lib/crypto/hex";
import { sendLicenseEmail } from "../../../src/lib/email/resend";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const body = await request.text();
  const sig = request.headers.get("Stripe-Signature");
  if (!sig) {
    return new Response(JSON.stringify({ error: "Missing Stripe-Signature header" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    httpClient: Stripe.createFetchHttpClient(),
  });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      sig,
      env.STRIPE_WEBHOOK_SECRET,
      undefined,
      Stripe.createSubtleCryptoProvider()
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: `Webhook verification failed: ${message}` }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (event.type !== "checkout.session.completed") {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const email = session.customer_details?.email;
  const org = session.metadata?.org;
  const plan = session.metadata?.plan ?? "pro-annual";

  if (!email || !org) {
    return new Response(JSON.stringify({ error: "Missing email or org in session" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const durationDays = plan.includes("monthly") ? 30 : 365;
  const payload = buildPayload(org, plan, durationDays);

  const privateKey = await importSeed(env.ED25519_SEED);
  const licenseKey = await signLicenseKey(privateKey, payload);

  // SHA-256 hash of the license key for KV storage
  const keyHash = bytesToHex(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(licenseKey))
    )
  );

  const metadata: LicenseMetadata = {
    email,
    org,
    plan,
    issued: payload.issued,
    expires: payload.expires,
    stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id ?? "",
    stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? "",
  };

  await env.LICENSE_KV.put(`license:${keyHash}`, JSON.stringify(metadata));

  await sendLicenseEmail({
    apiKey: env.RESEND_API_KEY,
    to: email,
    org,
    licenseKey,
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
