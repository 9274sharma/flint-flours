/**
 * Generate a URL-friendly slug from product name
 * Example: "Sourdough - Rustic" -> "SOURDOUGH_RUSTIC"
 */
export function generateProductSlug(name: string): string {
  return name
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/-/g, '_') // Replace hyphens with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
}

/**
 * Generate a variant slug from variant name
 * Example: "Plain" -> "plain", "Jalapeno-Cheese" -> "jalapeno-cheese"
 */
export function generateVariantSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}
