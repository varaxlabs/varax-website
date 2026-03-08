import { encode } from "./base64url";
import { hexToBytes } from "./hex";
import type { LicensePayload } from "../license/types";

const PKCS8_PREFIX = new Uint8Array([
  0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70,
  0x04, 0x22, 0x04, 0x20,
]);

function seedToPkcs8(seed: Uint8Array): Uint8Array {
  const pkcs8 = new Uint8Array(PKCS8_PREFIX.length + seed.length);
  pkcs8.set(PKCS8_PREFIX);
  pkcs8.set(seed, PKCS8_PREFIX.length);
  return pkcs8;
}

export async function importSeed(
  seedHex: string
): Promise<CryptoKey> {
  const seed = hexToBytes(seedHex);
  return crypto.subtle.importKey(
    "pkcs8",
    seedToPkcs8(seed),
    { name: "Ed25519" },
    false,
    ["sign"]
  );
}

export async function importPublicKey(
  pubkeyHex: string
): Promise<CryptoKey> {
  const raw = hexToBytes(pubkeyHex);
  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: "Ed25519" },
    false,
    ["verify"]
  );
}

export async function signLicenseKey(
  privateKey: CryptoKey,
  payload: LicensePayload
): Promise<string> {
  const payloadJSON = JSON.stringify(payload);
  const payloadB64 = encode(new TextEncoder().encode(payloadJSON));
  const signature = await crypto.subtle.sign(
    "Ed25519",
    privateKey,
    new TextEncoder().encode(payloadB64)
  );
  return payloadB64 + "." + encode(signature);
}

export async function verifyLicenseKey(
  publicKey: CryptoKey,
  key: string
): Promise<LicensePayload | null> {
  const dotIndex = key.indexOf(".");
  if (dotIndex === -1 || key.indexOf(".", dotIndex + 1) !== -1) {
    return null;
  }

  const payloadB64 = key.substring(0, dotIndex);
  const sigB64 = key.substring(dotIndex + 1);

  const sigBytes = atobUrl(sigB64);
  const valid = await crypto.subtle.verify(
    "Ed25519",
    publicKey,
    sigBytes,
    new TextEncoder().encode(payloadB64)
  );

  if (!valid) return null;

  const payloadJSON = new TextDecoder().decode(atobUrl(payloadB64));
  return JSON.parse(payloadJSON) as LicensePayload;
}

function atobUrl(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
