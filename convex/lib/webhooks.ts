/**
 * Webhook signature verification, implemented with Web Crypto so it runs
 * in the Convex runtime without extra dependencies.
 *
 * - Clerk and Resend sign with the Svix scheme.
 * - Stripe signs with its own HMAC scheme.
 * - RevenueCat sends a static Authorization header you configure in their
 *   dashboard (compared with timing-safe equality in http.ts).
 */

const encoder = new TextEncoder();

export const DEFAULT_TOLERANCE_SECONDS = 5 * 60;

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= (a[index] ?? 0) ^ (b[index] ?? 0);
  }

  return mismatch === 0;
}

export function timingSafeEqualStrings(a: string, b: string): boolean {
  return timingSafeEqual(encoder.encode(a), encoder.encode(b));
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256(
  key: Uint8Array,
  message: string,
): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key.slice().buffer as ArrayBuffer,
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(message),
  );
  return new Uint8Array(signature);
}

function isTimestampFresh(
  timestampSeconds: number,
  nowSeconds: number,
  toleranceSeconds: number,
): boolean {
  return (
    Number.isFinite(timestampSeconds) &&
    Math.abs(nowSeconds - timestampSeconds) <= toleranceSeconds
  );
}

/**
 * Verify a Svix-style signature (Clerk, Resend).
 *
 * @param secret The endpoint secret from the provider dashboard
 *   (`whsec_...`).
 */
export async function verifySvixSignature(input: {
  secret: string;
  svixId: string | null;
  svixTimestamp: string | null;
  svixSignature: string | null;
  payload: string;
  nowSeconds?: number;
  toleranceSeconds?: number;
}): Promise<boolean> {
  if (!input.svixId || !input.svixTimestamp || !input.svixSignature) {
    return false;
  }

  const timestamp = Number.parseInt(input.svixTimestamp, 10);
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const tolerance = input.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;
  if (!isTimestampFresh(timestamp, now, tolerance)) {
    return false;
  }

  const secretBytes = base64ToBytes(
    input.secret.startsWith("whsec_") ? input.secret.slice(6) : input.secret,
  );
  const signedContent = `${input.svixId}.${input.svixTimestamp}.${input.payload}`;
  const expected = bytesToBase64(await hmacSha256(secretBytes, signedContent));

  // Header format: "v1,<base64> v1,<base64> ..."
  return input.svixSignature.split(" ").some((candidate) => {
    const [version, signature] = candidate.split(",");
    return (
      version === "v1" &&
      signature !== undefined &&
      timingSafeEqualStrings(signature, expected)
    );
  });
}

/**
 * Verify a Stripe webhook signature.
 *
 * @param signatureHeader The `Stripe-Signature` header
 *   (`t=...,v1=...,v1=...`).
 */
export async function verifyStripeSignature(input: {
  secret: string;
  signatureHeader: string | null;
  payload: string;
  nowSeconds?: number;
  toleranceSeconds?: number;
}): Promise<boolean> {
  if (!input.signatureHeader) {
    return false;
  }

  const parts = input.signatureHeader.split(",").map((part) => part.trim());
  const timestampPart = parts.find((part) => part.startsWith("t="));
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3));

  if (!timestampPart || signatures.length === 0) {
    return false;
  }

  const timestamp = Number.parseInt(timestampPart.slice(2), 10);
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const tolerance = input.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;
  if (!isTimestampFresh(timestamp, now, tolerance)) {
    return false;
  }

  const expected = bytesToHex(
    await hmacSha256(
      encoder.encode(input.secret),
      `${timestamp}.${input.payload}`,
    ),
  );

  return signatures.some((signature) =>
    timingSafeEqualStrings(signature, expected),
  );
}
