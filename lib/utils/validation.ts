/** Magic bytes for common image formats (first few bytes) */
const IMAGE_SIGNATURES: { bytes: number[]; offset?: number }[] = [
  { bytes: [0xff, 0xd8, 0xff] }, // JPEG
  { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }, // PNG
  { bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] }, // GIF87a
  { bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }, // GIF89a
  { bytes: [0x52, 0x49, 0x46, 0x46] }, // WebP: RIFF at 0-3 (WEBP at 8-11 checked separately)
];

const WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50]; // WEBP at bytes 8-11

async function hasValidImageMagicBytes(file: File): Promise<boolean> {
  const buffer = await file.slice(0, 16).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  for (const { bytes: sig, offset = 0 } of IMAGE_SIGNATURES) {
    if (bytes.length < offset + sig.length) continue;
    const matches = sig.every((b, i) => bytes[offset + i] === b);
    if (matches) {
      // WebP: RIFF at 0-3, must also have WEBP at 8-11
      if (sig[0] === 0x52 && sig[1] === 0x49) {
        if (bytes.length >= 12 && WEBP_SIGNATURE.every((b, i) => bytes[8 + i] === b)) {
          return true;
        }
      } else {
        return true;
      }
    }
  }
  return false;
}

/**
 * Validate image file for upload.
 * Checks MIME type, size, and magic bytes to prevent spoofed uploads.
 * Returns error message string if invalid, null if valid.
 */
export async function validateImageFile(
  file: File | null,
  options?: { maxSizeBytes?: number }
): Promise<string | null> {
  if (!file) {
    return "No file provided";
  }

  if (!file.type.startsWith("image/")) {
    return "File must be an image";
  }

  const maxSize = options?.maxSizeBytes ?? 5 * 1024 * 1024; // 5MB default
  if (file.size > maxSize) {
    return "File size must be less than 5MB";
  }

  const validMagic = await hasValidImageMagicBytes(file);
  if (!validMagic) {
    return "File content does not match image format";
  }

  return null;
}
