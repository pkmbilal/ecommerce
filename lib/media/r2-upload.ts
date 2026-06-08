import "server-only";

import { createHmac, createHash } from "node:crypto";

import { getR2PublicMediaBaseUrl } from "@/lib/media/config";
import {
  getProductImageFileExtension,
  validateProductImageFile,
} from "@/lib/media/product-image-files";
import {
  getProfileAvatarFileExtension,
  validateProfileAvatarFile,
} from "@/lib/media/profile-avatar-files";

type R2UploadConfig = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBaseUrl: string;
};

export async function uploadProductImageToR2({
  file,
  productSlug,
  slot,
}: {
  file: File;
  productSlug: string;
  slot: number;
}) {
  validateProductImageFile(file);

  const config = requireR2UploadConfig();
  const extension = getProductImageFileExtension(file);

  if (!extension) {
    throw new Error("Product images must be JPEG, PNG, WebP, or AVIF files.");
  }

  const key = [
    "products",
    sanitizePathSegment(productSlug),
    `${Date.now()}-${slot}.${extension}`,
  ].join("/");
  const bytes = Buffer.from(await file.arrayBuffer());

  await putObjectToR2({
    config,
    key,
    body: bytes,
    contentType: file.type,
  });

  return `${config.publicBaseUrl}/${key}`;
}

export async function uploadProfileAvatarToR2({
  file,
  userId,
}: {
  file: File;
  userId: string;
}) {
  validateProfileAvatarFile(file);

  const config = requireR2UploadConfig();
  const extension = getProfileAvatarFileExtension(file);

  if (!extension) {
    throw new Error("Profile images must be JPEG, PNG, WebP, or AVIF files.");
  }

  const key = [
    "profiles",
    sanitizePathSegment(userId),
    `avatar-${Date.now()}.${extension}`,
  ].join("/");
  const bytes = Buffer.from(await file.arrayBuffer());

  await putObjectToR2({
    config,
    key,
    body: bytes,
    contentType: file.type,
  });

  return `${config.publicBaseUrl}/${key}`;
}

function requireR2UploadConfig(): R2UploadConfig {
  const config = {
    accountId: process.env.R2_ACCOUNT_ID?.trim(),
    accessKeyId: process.env.R2_ACCESS_KEY_ID?.trim(),
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY?.trim(),
    bucketName: process.env.R2_BUCKET_NAME?.trim(),
    publicBaseUrl: getR2PublicMediaBaseUrl(),
  };

  if (
    !config.accountId ||
    !config.accessKeyId ||
    !config.secretAccessKey ||
    !config.bucketName ||
    !config.publicBaseUrl
  ) {
    throw new Error("R2 upload is not configured.");
  }

  return config as R2UploadConfig;
}

async function putObjectToR2({
  config,
  key,
  body,
  contentType,
}: {
  config: R2UploadConfig;
  key: string;
  body: Buffer;
  contentType: string;
}) {
  const host = `${config.accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${encodePathSegments(config.bucketName)}/${encodePathSegments(key)}`;
  const endpoint = `https://${host}${canonicalUri}`;
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(body);
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalHeaders = [
    `content-type:${contentType}`,
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
    "",
  ].join("\n");
  const canonicalRequest = [
    "PUT",
    canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");
  const signingKey = getSigningKey(config.secretAccessKey, dateStamp);
  const signature = hmacHex(signingKey, stringToSign);

  const response = await fetch(endpoint, {
    method: "PUT",
    headers: {
      Authorization: [
        "AWS4-HMAC-SHA256 ",
        [
          `Credential=${config.accessKeyId}/${credentialScope}`,
          `SignedHeaders=${signedHeaders}`,
          `Signature=${signature}`,
        ].join(", "),
      ].join(""),
      "Content-Type": contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    },
    body: new Uint8Array(body),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to upload product image to R2 (${response.status}): ${await getSafeR2ErrorMessage(response)}`,
    );
  }
}

async function getSafeR2ErrorMessage(response: Response) {
  const text = (await response.text()).trim();

  if (!text) {
    return response.statusText || "No response body returned.";
  }

  return text.replaceAll(/\s+/g, " ").slice(0, 300);
}

function sanitizePathSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "product";
}

function encodePathSegments(value: string) {
  return value.split("/").map(encodeURIComponent).join("/");
}

function toAmzDate(date: Date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function sha256Hex(value: Buffer | string) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function hmacHex(key: Buffer, value: string) {
  return createHmac("sha256", key).update(value).digest("hex");
}

function getSigningKey(secretAccessKey: string, dateStamp: string) {
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const regionKey = hmac(dateKey, "auto");
  const serviceKey = hmac(regionKey, "s3");

  return hmac(serviceKey, "aws4_request");
}
