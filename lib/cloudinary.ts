import { v2 as cloudinary } from "cloudinary";

function cleanEnv(val: string | undefined | null): string | undefined {
  if (!val) return undefined;
  const trimmed = val.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed || undefined;
}

// 1. Resolve credentials from standard individual env vars
let cloud_name =
  cleanEnv(process.env.CLOUDINARY_CLOUD_NAME) ||
  cleanEnv(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) ||
  cleanEnv(process.env.CLOUDINARY_NAME);

let api_key =
  cleanEnv(process.env.CLOUDINARY_API_KEY) ||
  cleanEnv(process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY) ||
  cleanEnv(process.env.CLOUDINARY_KEY);

let api_secret =
  cleanEnv(process.env.CLOUDINARY_API_SECRET) ||
  cleanEnv(process.env.CLOUDINARY_SECRET);

// 2. Parse CLOUDINARY_URL if present (e.g. cloudinary://api_key:api_secret@cloud_name)
const cloudinaryUrl = cleanEnv(process.env.CLOUDINARY_URL);
if (cloudinaryUrl) {
  try {
    const parsed = new URL(cloudinaryUrl);
    if (!cloud_name && parsed.hostname) cloud_name = parsed.hostname;
    if (!api_key && parsed.username) api_key = decodeURIComponent(parsed.username);
    if (!api_secret && parsed.password) api_secret = decodeURIComponent(parsed.password);
  } catch {
    const match = cloudinaryUrl.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
    if (match) {
      if (!api_key) api_key = decodeURIComponent(match[1]);
      if (!api_secret) api_secret = decodeURIComponent(match[2]);
      if (!cloud_name) cloud_name = match[3];
    }
  }
}

export const isCloudinaryConfigured = Boolean(cloud_name && api_key && api_secret);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name,
    api_key,
    api_secret,
    secure: true,
  });
}

export function getCloudinaryStatus() {
  return {
    isConfigured: isCloudinaryConfigured,
    hasCloudName: Boolean(cloud_name),
    hasApiKey: Boolean(api_key),
    hasApiSecret: Boolean(api_secret),
  };
}

export default cloudinary;