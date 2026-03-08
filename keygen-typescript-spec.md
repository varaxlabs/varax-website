# Keygen TypeScript Implementation Spec

This document provides everything needed to rewrite the Go `cmd/keygen` tool in TypeScript for the Cloudflare Worker. The Go source lives at `cmd/keygen/main.go`.

## Overview

The keygen has two commands:

1. **`generate-keypair`** — Create a new Ed25519 keypair (one-time setup)
2. **`sign`** — Sign a license key for a customer

The CLI binary is internal-only. The TypeScript version will run as a Cloudflare Worker endpoint called during license purchase/renewal.

## Cryptographic Details

### Algorithm

- **Ed25519** (RFC 8032) — deterministic, 32-byte seeds, 64-byte signatures
- Use the W3C **Secure Curves** API: `{ name: "Ed25519" }`
- Do NOT use the legacy `NODE-ED25519` algorithm name

### Key Material

| Type | Size | Format |
|------|------|--------|
| Seed (private) | 32 bytes | Raw binary |
| Private key (Go) | 64 bytes | `seed ∥ public_key` concatenation |
| Public key | 32 bytes | Raw binary |

Go's `ed25519.PrivateKey` is 64 bytes: the first 32 bytes are the seed, the last 32 are the public key. The seed alone is sufficient to derive the full keypair.

### Web Crypto Key Import

Ed25519 private keys **cannot** be imported as `"raw"` in Web Crypto — that format is only valid for public keys. Private keys must use PKCS8.

Ed25519 PKCS8 encoding is the 32-byte seed prepended with a fixed 16-byte ASN.1 DER header:

```
Header (hex): 302e020100300506032b657004220420
```

```typescript
function ed25519SeedToPkcs8(seed: Uint8Array): Uint8Array {
  const prefix = new Uint8Array([
    0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06,
    0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20,
  ]);
  const pkcs8 = new Uint8Array(prefix.length + seed.length);
  pkcs8.set(prefix);
  pkcs8.set(seed, prefix.length);
  return pkcs8;
}

const privateKey = await crypto.subtle.importKey(
  "pkcs8",
  ed25519SeedToPkcs8(seedBytes),
  { name: "Ed25519" },
  false,
  ["sign"]
);
```

## License Key Format

```
<payloadB64>.<sigB64>
```

Two base64url-encoded segments (no padding) separated by a single `.`.

## Signing Algorithm (Step by Step)

This is the exact sequence. Each step must match byte-for-byte with the Go implementation.

### Step 1: Build Payload Object

```typescript
const payload = {
  expires: "2027-01-15T00:00:00Z",
  features: ["reports", "evidence", "remediation", "scheduled-reports"],
  issued: "2026-01-15T00:00:00Z",
  org: "Acme Corp",
  plan: "pro-annual",
};
```

**Keys must be in alphabetical order.** Go's `json.Marshal(map[string]interface{}{...})` sorts map keys alphabetically. The TypeScript implementation must produce identical JSON.

Use `JSON.stringify()` with keys already in alphabetical order (JS objects preserve insertion order) or sort explicitly.

### Step 2: Serialize to JSON

```typescript
const payloadJSON = JSON.stringify(payload);
// No trailing newline, compact format (no spaces)
```

### Step 3: Base64url Encode the JSON

```typescript
const payloadB64 = base64url(new TextEncoder().encode(payloadJSON));
```

Base64url encoding: standard base64 with `+` → `-`, `/` → `_`, no `=` padding.

```typescript
function base64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
```

### Step 4: Sign the Base64url String

**Sign the string bytes of `payloadB64`, NOT the raw JSON bytes.** This is the most critical detail.

```typescript
const signature = await crypto.subtle.sign(
  "Ed25519",
  privateKey,
  new TextEncoder().encode(payloadB64) // UTF-8 bytes of the base64url STRING
);
```

### Step 5: Base64url Encode the Signature

```typescript
const sigB64 = base64url(signature);
```

The signature is always 64 bytes.

### Step 6: Concatenate

```typescript
const licenseKey = payloadB64 + "." + sigB64;
```

## Payload Schema

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `org` | string | Customer organization name | `"Acme Corp"` |
| `plan` | string | Plan identifier | `"pro-annual"` |
| `issued` | string | RFC 3339, second precision, UTC, trailing `Z` | `"2026-01-15T00:00:00Z"` |
| `expires` | string | RFC 3339, second precision, UTC, trailing `Z` | `"2027-01-15T00:00:00Z"` |
| `features` | string[] | Enabled feature flags | `["reports", "evidence"]` |

### Timestamp Format

Must be RFC 3339 with:
- Second precision (no milliseconds)
- UTC timezone indicated by `Z` suffix (not `+00:00`)
- Example: `2026-01-15T00:00:00Z`

Go's `time.Time` marshals to this format by default via `json.Marshal`.

In TypeScript:
```typescript
// Correct: produces "2026-01-15T00:00:00.000Z" — need to strip milliseconds
function toRFC3339(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}
```

### Plan Strings

| Value | Description |
|-------|-------------|
| `pro-annual` | Annual Pro subscription |
| `pro-monthly` | Monthly Pro subscription |

### Feature Strings

| Value | Description |
|-------|-------------|
| `reports` | HTML readiness and executive reports |
| `evidence` | Evidence export for auditors |
| `remediation` | Auto-remediation of violations |
| `scheduled-reports` | Scheduled report generation |
| `explore` | Full-screen TUI explorer |

The default feature set for a Pro license:
```
reports,evidence,remediation,scheduled-reports
```

The `explore` feature is included for `pro-annual` plans.

## Go `keygen sign` CLI Flags

These map to the Worker's request parameters:

| Go Flag | Default | Description |
|---------|---------|-------------|
| `--org` | (required) | Organization name |
| `--plan` | `pro-annual` | Plan identifier |
| `--features` | `reports,evidence,remediation,scheduled-reports` | Comma-separated feature list |
| `--duration` | `365d` | License duration in days |
| `--private-key` | `private.key` | Path to 64-byte private key file |

### Duration Handling

The Go implementation:
1. Parses `--duration` as `Nd` (e.g., `365d` → 365 days)
2. Sets `issued` to `time.Now().UTC().Truncate(time.Second)` — current time, truncated to second precision
3. Sets `expires` to `issued + (days * 24h)`

```typescript
const now = new Date();
now.setMilliseconds(0); // truncate to second precision
const issued = now;
const expires = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
```

## Validation Rules (CLI Side)

The Go CLI validates incoming keys with these rules. The Worker doesn't need to validate, but knowing these helps avoid generating invalid keys:

1. Key must contain exactly one `.` separator
2. Both segments must be valid base64url (no padding)
3. Ed25519 signature must verify against the embedded public key
4. `issued` must not be in the future (clock skew protection)
5. `expires` + 5-day grace period must not have passed

The 5-day grace period means a key with `expires: 2027-01-15` is accepted until `2027-01-20`.

## Keypair Generation

The Go `generate-keypair` command:
1. Generates a random Ed25519 keypair via `crypto/rand`
2. Writes `private.key` (64 bytes, binary) and `public.key` (32 bytes, binary)
3. Prints the public key as a Go byte literal for embedding in `pkg/license/pubkey.go`

For the Worker, store the 32-byte seed (first 32 bytes of the 64-byte private key) as a Cloudflare secret. The public key is already embedded in the CLI binary.

## Golden Test Vectors

Use these to verify your TypeScript implementation produces byte-identical output. Source: `pkg/license/golden_test.go`.

### Test Keypair

| Field | Hex Value |
|-------|-----------|
| Seed (32 bytes) | `4b7a2c0e1f3a5d6b8c9e0f1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e` |
| Public key (32 bytes) | `04e67e5b5b148ea9c3404f3bf2626283a0e38cd7ebf90c1e16b891a4314ea2b5` |

### Test Payload

```json
{"expires":"2027-01-15T00:00:00Z","features":["reports","evidence","remediation","scheduled-reports","explore"],"issued":"2026-01-15T00:00:00Z","org":"Acme Corp","plan":"pro-annual"}
```

### Expected Output

| Step | Value |
|------|-------|
| payloadB64 | `eyJleHBpcmVzIjoiMjAyNy0wMS0xNVQwMDowMDowMFoiLCJmZWF0dXJlcyI6WyJyZXBvcnRzIiwiZXZpZGVuY2UiLCJyZW1lZGlhdGlvbiIsInNjaGVkdWxlZC1yZXBvcnRzIiwiZXhwbG9yZSJdLCJpc3N1ZWQiOiIyMDI2LTAxLTE1VDAwOjAwOjAwWiIsIm9yZyI6IkFjbWUgQ29ycCIsInBsYW4iOiJwcm8tYW5udWFsIn0` |
| sigB64 | `Y66LnOrt64zN82wqjZeStwsyITsX94Qr24QILc8rcLTttlQf0XThJW2stfBsCZQQVDh4LlQ9O-ewOuXsK2AMBg` |
| License key | `eyJleHBpcmVzIjoiMjAyNy0wMS0xNVQwMDowMDowMFoiLCJmZWF0dXJlcyI6WyJyZXBvcnRzIiwiZXZpZGVuY2UiLCJyZW1lZGlhdGlvbiIsInNjaGVkdWxlZC1yZXBvcnRzIiwiZXhwbG9yZSJdLCJpc3N1ZWQiOiIyMDI2LTAxLTE1VDAwOjAwOjAwWiIsIm9yZyI6IkFjbWUgQ29ycCIsInBsYW4iOiJwcm8tYW5udWFsIn0.Y66LnOrt64zN82wqjZeStwsyITsX94Qr24QILc8rcLTttlQf0XThJW2stfBsCZQQVDh4LlQ9O-ewOuXsK2AMBg` |

### Complete TypeScript Validation Test

```typescript
const GOLDEN_SEED = "4b7a2c0e1f3a5d6b8c9e0f1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e";
const EXPECTED_KEY = "eyJleHBpcmVzIjoiMjAyNy0wMS0xNVQwMDowMDowMFoiLCJmZWF0dXJlcyI6WyJyZXBvcnRzIiwiZXZpZGVuY2UiLCJyZW1lZGlhdGlvbiIsInNjaGVkdWxlZC1yZXBvcnRzIiwiZXhwbG9yZSJdLCJpc3N1ZWQiOiIyMDI2LTAxLTE1VDAwOjAwOjAwWiIsIm9yZyI6IkFjbWUgQ29ycCIsInBsYW4iOiJwcm8tYW5udWFsIn0.Y66LnOrt64zN82wqjZeStwsyITsX94Qr24QILc8rcLTttlQf0XThJW2stfBsCZQQVDh4LlQ9O-ewOuXsK2AMBg";

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function ed25519SeedToPkcs8(seed: Uint8Array): Uint8Array {
  const prefix = new Uint8Array([
    0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06,
    0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20,
  ]);
  const pkcs8 = new Uint8Array(prefix.length + seed.length);
  pkcs8.set(prefix);
  pkcs8.set(seed, prefix.length);
  return pkcs8;
}

function base64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function toRFC3339(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

async function testGoldenVector(): Promise<void> {
  const seed = hexToBytes(GOLDEN_SEED);

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    ed25519SeedToPkcs8(seed),
    { name: "Ed25519" },
    false,
    ["sign"]
  );

  // Keys MUST be alphabetically ordered
  const payload = JSON.stringify({
    expires: "2027-01-15T00:00:00Z",
    features: ["reports", "evidence", "remediation", "scheduled-reports", "explore"],
    issued: "2026-01-15T00:00:00Z",
    org: "Acme Corp",
    plan: "pro-annual",
  });

  const payloadB64 = base64url(new TextEncoder().encode(payload));
  const signature = await crypto.subtle.sign(
    "Ed25519",
    privateKey,
    new TextEncoder().encode(payloadB64)
  );
  const key = payloadB64 + "." + base64url(signature);

  if (key !== EXPECTED_KEY) {
    throw new Error(`Golden vector mismatch!\nGot:      ${key}\nExpected: ${EXPECTED_KEY}`);
  }
  console.log("Golden vector test passed");
}
```

## Refresh API Contract

The Worker also needs to implement the license refresh endpoint. The CLI calls this to get a renewed key before expiry.

### Endpoint

```
POST /v1/license/refresh
```

### Request

```json
{
  "key": "<current_license_key>"
}
```

Headers:
- `Content-Type: application/json`
- `User-Agent: varax`

### Response Codes

| Status | Meaning |
|--------|---------|
| 200 | Success — return new signed key |
| 401 | Subscription inactive |
| 404 | License not recognized |
| 429 | Rate limited |
| 5xx | Server error |

### Success Response (200)

```json
{
  "key": "<new_license_key>"
}
```

### Error Response (non-200)

```json
{
  "error": "human-readable error message"
}
```

## Common Pitfalls

1. **Signing the wrong bytes.** Sign `payloadB64` string bytes, NOT the raw JSON bytes.
2. **Wrong JSON field order.** Keys must be alphabetical: `expires`, `features`, `issued`, `org`, `plan`.
3. **Timestamp format.** Must be `2026-01-15T00:00:00Z` — no milliseconds, `Z` suffix (not `+00:00`).
4. **Base64url padding.** No `=` padding characters.
5. **Private key import format.** Use `"pkcs8"` with the ASN.1 prefix, not `"raw"`.
6. **Algorithm name.** Use `{ name: "Ed25519" }` (Secure Curves), not `NODE-ED25519`.
7. **Seed vs private key.** The Worker stores the 32-byte seed. Go's 64-byte "private key" is `seed ∥ public_key`.
