import { bytesToHex } from "../src/lib/crypto/hex";

async function main() {
  const keyPair = await crypto.subtle.generateKey(
    { name: "Ed25519" },
    true,
    ["sign", "verify"]
  );

  // Export raw public key (32 bytes)
  const publicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", keyPair.publicKey)
  );

  // Export PKCS8 private key, extract 32-byte seed (last 32 bytes of the 48-byte PKCS8)
  const pkcs8 = new Uint8Array(
    await crypto.subtle.exportKey("pkcs8", keyPair.privateKey)
  );
  const seed = pkcs8.slice(16, 48);

  console.log("Ed25519 Keypair Generated");
  console.log("========================");
  console.log();
  console.log(`Seed (32 bytes, hex):       ${bytesToHex(seed)}`);
  console.log(`Public Key (32 bytes, hex): ${bytesToHex(publicKeyRaw)}`);
  console.log();
  console.log("Set these as Cloudflare Pages secrets:");
  console.log(`  npx wrangler pages secret put ED25519_SEED`);
  console.log(`  npx wrangler pages secret put ED25519_PUBLIC_KEY`);
}

main().catch(console.error);
