import { describe, expect, it } from "vitest";

import {
  timingSafeEqualStrings,
  verifyStripeSignature,
  verifySvixSignature,
} from "./webhooks";

const encoder = new TextEncoder();

async function hmacBase64(secretBytes: Uint8Array, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    // Uint8Array.from copies into a fresh buffer — Buffer views share a
    // pooled ArrayBuffer, which would corrupt the key material.
    Uint8Array.from(secretBytes).buffer as ArrayBuffer,
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(message)),
  );
  return Buffer.from(signature).toString("base64");
}

async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret).slice().buffer as ArrayBuffer,
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(message)),
  );
  return Buffer.from(signature).toString("hex");
}

describe("svix verification (Clerk, Resend)", () => {
  const rawSecret = Buffer.from("super-secret-webhook-key").toString("base64");
  const secret = `whsec_${rawSecret}`;
  const payload = '{"type":"user.created","data":{"id":"user_1"}}';

  it("accepts a valid signature", async () => {
    const now = 1_700_000_000;
    const signature = await hmacBase64(
      Buffer.from(rawSecret, "base64"),
      `msg_1.${now}.${payload}`,
    );

    await expect(
      verifySvixSignature({
        nowSeconds: now,
        payload,
        secret,
        svixId: "msg_1",
        svixSignature: `v1,${signature}`,
        svixTimestamp: String(now),
      }),
    ).resolves.toBe(true);
  });

  it("rejects tampered payloads, missing headers, and stale timestamps", async () => {
    const now = 1_700_000_000;
    const signature = await hmacBase64(
      Buffer.from(rawSecret, "base64"),
      `msg_1.${now}.${payload}`,
    );

    await expect(
      verifySvixSignature({
        nowSeconds: now,
        payload: `${payload} `,
        secret,
        svixId: "msg_1",
        svixSignature: `v1,${signature}`,
        svixTimestamp: String(now),
      }),
    ).resolves.toBe(false);

    await expect(
      verifySvixSignature({
        nowSeconds: now,
        payload,
        secret,
        svixId: null,
        svixSignature: `v1,${signature}`,
        svixTimestamp: String(now),
      }),
    ).resolves.toBe(false);

    await expect(
      verifySvixSignature({
        nowSeconds: now + 3600,
        payload,
        secret,
        svixId: "msg_1",
        svixSignature: `v1,${signature}`,
        svixTimestamp: String(now),
      }),
    ).resolves.toBe(false);
  });
});

describe("stripe verification", () => {
  const secret = "whsec_stripe_test";
  const payload = '{"id":"evt_1","type":"checkout.session.completed"}';

  it("accepts a valid signature and rejects a wrong one", async () => {
    const now = 1_700_000_000;
    const signature = await hmacHex(secret, `${now}.${payload}`);

    await expect(
      verifyStripeSignature({
        nowSeconds: now,
        payload,
        secret,
        signatureHeader: `t=${now},v1=${signature}`,
      }),
    ).resolves.toBe(true);

    await expect(
      verifyStripeSignature({
        nowSeconds: now,
        payload,
        secret,
        signatureHeader: `t=${now},v1=${"0".repeat(64)}`,
      }),
    ).resolves.toBe(false);
  });
});

describe("timing-safe comparison", () => {
  it("compares strings without early exit semantics", () => {
    expect(timingSafeEqualStrings("token", "token")).toBe(true);
    expect(timingSafeEqualStrings("token", "tokem")).toBe(false);
    expect(timingSafeEqualStrings("token", "toke")).toBe(false);
  });
});
