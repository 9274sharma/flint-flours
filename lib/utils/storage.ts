import { logger } from "@/lib/logger";

/**
 * Extract file path from Supabase Storage public URL
 * URL format: https://xxx.supabase.co/storage/v1/object/public/{bucket}/{filePath}
 * Example: https://xxx.supabase.co/storage/v1/object/public/products/products/file.jpg
 * Returns: products/file.jpg (path within the bucket, excluding the bucket name from URL)
 */
export function extractFilePathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(p => p); // Remove empty strings
    const publicIndex = pathParts.indexOf('public');
    
    if (publicIndex === -1 || publicIndex === pathParts.length - 1) {
      return null;
    }
    
    // After 'public', the next part is the bucket name, then comes the actual file path
    // Skip bucket name and return the rest as the file path
    if (publicIndex + 2 < pathParts.length) {
      return pathParts.slice(publicIndex + 2).join('/');
    }
    
    return null;
  } catch (error) {
    logger.error("Error extracting file path from URL", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

type SupabaseClientWithStorage = {
  storage: {
    from: (bucket: string) => {
      remove: (paths: string[]) => Promise<{ data: unknown; error: Error | null }>;
    };
  };
};

/**
 * Delete images from Supabase Storage
 * @param supabase - Supabase client instance
 * @param imageUrls - Array of image URLs to delete
 * @param bucket - Storage bucket name (default: 'products')
 * @returns Array of successfully deleted file paths
 */
export async function deleteImagesFromStorage(
  supabase: SupabaseClientWithStorage,
  imageUrls: string[],
  bucket: string = 'products'
): Promise<string[]> {
  const deletedPaths: string[] = [];
  
  if (!imageUrls || imageUrls.length === 0) {
    return deletedPaths;
  }
  
  for (const url of imageUrls) {
    if (!url || typeof url !== "string") {
      logger.warn("Invalid URL provided for deletion", { url });
      continue;
    }

    const filePath = extractFilePathFromUrl(url);
    if (!filePath) {
      logger.warn("Could not extract file path from URL", { url });
      continue;
    }
    
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);
      
      if (error) {
        if (error.message?.includes("not found") || error.message?.includes("does not exist")) {
          deletedPaths.push(filePath); // Count as success since goal is achieved
        } else {
          logger.error("Error deleting file", { filePath, error: error.message });
        }
      } else {
        deletedPaths.push(filePath);
      }
    } catch (error) {
      logger.error("Exception deleting file", {
        filePath,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  
  return deletedPaths;
}
