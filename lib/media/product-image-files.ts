export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_PRODUCT_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);

export function validateProductImageFile(file: File) {
  if (file.size <= 0) {
    throw new Error("Selected product image files cannot be empty.");
  }

  if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
    throw new Error("Product image files must be 5 MB or smaller.");
  }

  if (!ALLOWED_PRODUCT_IMAGE_TYPES.has(file.type)) {
    throw new Error("Product images must be JPEG, PNG, WebP, or AVIF files.");
  }
}

export function getProductImageFileExtension(file: File) {
  return ALLOWED_PRODUCT_IMAGE_TYPES.get(file.type);
}
