"use client";

import { useState, useEffect, useCallback } from "react";

export type CraftImage = { path: string; url: string };

export function useCraftImages() {
  const [images, setImages] = useState<CraftImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/craft/images");
      if (!res.ok) {
        if (res.status === 401) {
          setError("Please sign in as admin.");
          setImages([]);
          return;
        }
        throw new Error("Failed to fetch");
      }
      const data = await res.json();
      setImages(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load images.");
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { images, loading, error, refetch };
}
