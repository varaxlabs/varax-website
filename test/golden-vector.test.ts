import { describe, it, expect } from "vitest";
import { importSeed, signLicenseKey, verifyLicenseKey, importPublicKey } from "../src/lib/crypto/ed25519";
import type { LicensePayload } from "../src/lib/license/types";

const GOLDEN_SEED = "4b7a2c0e1f3a5d6b8c9e0f1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e";
const GOLDEN_PUBKEY = "04e67e5b5b148ea9c3404f3bf2626283a0e38cd7ebf90c1e16b891a4314ea2b5";

const EXPECTED_KEY =
  "eyJleHBpcmVzIjoiMjAyNy0wMS0xNVQwMDowMDowMFoiLCJmZWF0dXJlcyI6WyJyZXBvcnRzIiwiZXZpZGVuY2UiLCJyZW1lZGlhdGlvbiIsInNjaGVkdWxlZC1yZXBvcnRzIiwiZXhwbG9yZSJdLCJpc3N1ZWQiOiIyMDI2LTAxLTE1VDAwOjAwOjAwWiIsIm9yZyI6IkFjbWUgQ29ycCIsInBsYW4iOiJwcm8tYW5udWFsIn0.Y66LnOrt64zN82wqjZeStwsyITsX94Qr24QILc8rcLTttlQf0XThJW2stfBsCZQQVDh4LlQ9O-ewOuXsK2AMBg";

describe("golden vector", () => {
  it("produces a byte-identical license key to the Go implementation", async () => {
    const privateKey = await importSeed(GOLDEN_SEED);

    // Keys in alphabetical order — matches Go's json.Marshal output
    const payload: LicensePayload = {
      expires: "2027-01-15T00:00:00Z",
      features: ["reports", "evidence", "remediation", "scheduled-reports", "explore"],
      issued: "2026-01-15T00:00:00Z",
      org: "Acme Corp",
      plan: "pro-annual",
    };

    const key = await signLicenseKey(privateKey, payload);
    expect(key).toBe(EXPECTED_KEY);
  });

  it("verifies the golden vector key with the public key", async () => {
    const publicKey = await importPublicKey(GOLDEN_PUBKEY);
    const payload = await verifyLicenseKey(publicKey, EXPECTED_KEY);

    expect(payload).not.toBeNull();
    expect(payload!.org).toBe("Acme Corp");
    expect(payload!.plan).toBe("pro-annual");
    expect(payload!.expires).toBe("2027-01-15T00:00:00Z");
    expect(payload!.features).toEqual([
      "reports", "evidence", "remediation", "scheduled-reports", "explore",
    ]);
  });

  it("rejects a tampered key", async () => {
    const publicKey = await importPublicKey(GOLDEN_PUBKEY);
    // Flip a character in the payload portion (before the dot)
    const dotIndex = EXPECTED_KEY.indexOf(".");
    const tampered =
      EXPECTED_KEY.substring(0, 10) +
      (EXPECTED_KEY[10] === "A" ? "B" : "A") +
      EXPECTED_KEY.substring(11);
    expect(tampered).not.toBe(EXPECTED_KEY);
    const payload = await verifyLicenseKey(publicKey, tampered);
    expect(payload).toBeNull();
  });
});
