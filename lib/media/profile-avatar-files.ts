export const PROFILE_AVATAR_MAX_BYTES = 2 * 1024 * 1024;

const ALLOWED_PROFILE_AVATAR_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);

export function validateProfileAvatarFile(file: File) {
  if (file.size <= 0) {
    throw new Error("Selected profile image cannot be empty.");
  }

  if (file.size > PROFILE_AVATAR_MAX_BYTES) {
    throw new Error("Profile image files must be 2 MB or smaller.");
  }

  if (!ALLOWED_PROFILE_AVATAR_TYPES.has(file.type)) {
    throw new Error("Profile images must be JPEG, PNG, WebP, or AVIF files.");
  }
}

export function getProfileAvatarFileExtension(file: File) {
  return ALLOWED_PROFILE_AVATAR_TYPES.get(file.type);
}
