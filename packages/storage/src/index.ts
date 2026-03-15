import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { type EntitlementTier, entitlementTierSchema } from "@launch/domain";
import { z } from "zod";

export const uploadStrategySchema = z.enum(["single"]);

export const allowedUploadMimeTypes = [
  "application/json",
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "audio/m4a",
  "audio/mpeg",
  "audio/wav",
  "text/csv",
  "text/markdown",
  "text/plain",
] as const;

export const textExtractionMimeTypes = new Set<string>([
  "application/json",
  "application/pdf",
  "text/csv",
  "text/markdown",
  "text/plain",
]);

export const storageTierLimits = {
  free: {
    maxFileBytes: 25 * 1024 * 1024,
    maxTotalBytes: 1024 * 1024 * 1024,
  },
  lifetime: {
    maxFileBytes: 100 * 1024 * 1024,
    maxTotalBytes: 20 * 1024 * 1024 * 1024,
  },
  pro: {
    maxFileBytes: 100 * 1024 * 1024,
    maxTotalBytes: 20 * 1024 * 1024 * 1024,
  },
} as const satisfies Record<
  EntitlementTier,
  { maxFileBytes: number; maxTotalBytes: number }
>;

export type R2ClientConfig = {
  accessKeyId: string;
  accountId: string;
  secretAccessKey: string;
};

export type UploadPolicyInput = {
  allowedMimeTypes?: readonly string[];
  fileName: string;
  maxUploadBytes?: number;
  mimeType: string;
  sizeBytes: number;
  tier: EntitlementTier;
  totalUsageBytes: number;
};

export function resolveStorageLimits(tier: EntitlementTier) {
  return storageTierLimits[entitlementTierSchema.parse(tier)];
}

export function sanitizeFileName(fileName: string) {
  const normalized = fileName.normalize("NFKD").replace(/[^\x20-\x7E]/g, "");
  const collapsed = normalized
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^A-Za-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^\.+/, "")
    .replace(/^-+/, "");

  return collapsed.length > 0 ? collapsed.slice(0, 120) : "file";
}

export function buildObjectKey(input: {
  createdAt?: Date;
  fileId: string;
  fileName: string;
  profileId: string;
  purpose: string;
}) {
  const createdAt = input.createdAt ?? new Date();
  const year = String(createdAt.getUTCFullYear());
  const month = String(createdAt.getUTCMonth() + 1).padStart(2, "0");
  const sanitizedName = sanitizeFileName(input.fileName);

  return `profiles/${input.profileId}/${input.purpose}/${year}/${month}/${input.fileId}/${sanitizedName}`;
}

export function buildR2Endpoint(accountId: string) {
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

export function createR2Client(config: R2ClientConfig) {
  return new S3Client({
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: buildR2Endpoint(config.accountId),
    region: "auto",
  });
}

export function assertUploadAllowed(input: UploadPolicyInput) {
  const limits = resolveStorageLimits(input.tier);
  const allowedMimeTypes = input.allowedMimeTypes ?? allowedUploadMimeTypes;

  if (!allowedMimeTypes.includes(input.mimeType)) {
    throw new Error(`Unsupported file type: ${input.mimeType}`);
  }

  if (input.sizeBytes <= 0) {
    throw new Error("Files must be larger than 0 bytes");
  }

  const maxFileBytes = Math.min(
    limits.maxFileBytes,
    input.maxUploadBytes ?? limits.maxFileBytes,
  );

  if (input.sizeBytes > maxFileBytes) {
    throw new Error(
      `File exceeds the current per-file limit of ${formatBytes(maxFileBytes)}`,
    );
  }

  if (input.totalUsageBytes + input.sizeBytes > limits.maxTotalBytes) {
    throw new Error(
      `Storage usage exceeds the current account limit of ${formatBytes(
        limits.maxTotalBytes,
      )}`,
    );
  }

  if (sanitizeFileName(input.fileName).length === 0) {
    throw new Error("File name must contain at least one valid character");
  }
}

export function formatBytes(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  let value = sizeBytes;
  let unitIndex = -1;

  do {
    value /= 1024;
    unitIndex += 1;
  } while (value >= 1024 && unitIndex < units.length - 1);

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${
    units[unitIndex]
  }`;
}

export async function createSignedUploadUrl(input: {
  bucket: string;
  client: S3Client;
  contentDisposition?: string;
  expiresIn: number;
  key: string;
  mimeType: string;
}) {
  const command = new PutObjectCommand({
    Bucket: input.bucket,
    ContentDisposition: input.contentDisposition,
    ContentType: input.mimeType,
    Key: input.key,
  });

  return getSignedUrl(input.client, command, {
    expiresIn: input.expiresIn,
  });
}

export async function createSignedDownloadUrl(input: {
  bucket: string;
  client: S3Client;
  disposition: "attachment" | "inline";
  expiresIn: number;
  fileName: string;
  key: string;
}) {
  const encodedName = encodeURIComponent(input.fileName);
  const command = new GetObjectCommand({
    Bucket: input.bucket,
    Key: input.key,
    ResponseContentDisposition: `${input.disposition}; filename*=UTF-8''${encodedName}`,
  });

  return getSignedUrl(input.client, command, {
    expiresIn: input.expiresIn,
  });
}

export async function headPrivateObject(input: {
  bucket: string;
  client: S3Client;
  key: string;
}) {
  return input.client.send(
    new HeadObjectCommand({
      Bucket: input.bucket,
      Key: input.key,
    }),
  );
}

export async function putPrivateObject(input: {
  body: string | Uint8Array;
  bucket: string;
  client: S3Client;
  contentDisposition?: string;
  key: string;
  metadata?: Record<string, string>;
  mimeType: string;
}) {
  return input.client.send(
    new PutObjectCommand({
      Body: input.body,
      Bucket: input.bucket,
      ContentDisposition: input.contentDisposition,
      ContentType: input.mimeType,
      Key: input.key,
      Metadata: input.metadata,
    }),
  );
}

export async function deletePrivateObject(input: {
  bucket: string;
  client: S3Client;
  key: string;
}) {
  return input.client.send(
    new DeleteObjectCommand({
      Bucket: input.bucket,
      Key: input.key,
    }),
  );
}
