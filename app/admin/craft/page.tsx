"use client";

import { useState } from "react";
import { useCraftImages } from "@/lib/hooks/useCraftImages";

const MAX_IMAGES = 8;

export default function AdminCraftPage() {
  const { images, loading, error, refetch } = useCraftImages();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const displayError = localError || error;

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (images.length >= MAX_IMAGES) {
      setLocalError(`Maximum ${MAX_IMAGES} images allowed. Delete one first.`);
      return;
    }

    setUploading(true);
    setLocalError(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch("/api/craft/images", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      await refetch();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(path: string) {
    setDeleting(path);
    setLocalError(null);
    try {
      const res = await fetch("/api/craft/images/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      await refetch();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Our Craft Images</h1>
        <p className="mt-4 text-gray-700">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Our Craft Images</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {images.length} / {MAX_IMAGES} images
          </span>
          <label className="cursor-pointer rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-900 disabled:opacity-50">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading || images.length >= MAX_IMAGES}
            />
            {uploading ? "Uploading..." : "Upload image"}
          </label>
        </div>
      </div>

      {displayError && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          {displayError}
        </div>
      )}

      <p className="mt-4 text-gray-600">
        Manage the 8 images shown in the &quot;Our Craft&quot; section on the
        homepage. Upload and delete as needed.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {images.map((img) => (
          <div
            key={img.path}
            className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-100"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt="Craft"
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleDelete(img.path)}
              disabled={deleting === img.path}
              className="absolute right-2 top-2 rounded-lg bg-red-600 px-2 py-1 text-xs font-medium text-white opacity-0 transition hover:bg-red-700 group-hover:opacity-100 disabled:opacity-50"
              aria-label="Delete image"
            >
              {deleting === img.path ? "Deleting..." : "Delete"}
            </button>
          </div>
        ))}
        {images.length < MAX_IMAGES &&
          Array.from({ length: MAX_IMAGES - images.length }).map((_, i) => (
            <label
              key={`empty-${i}`}
              className="flex aspect-square cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 transition hover:border-gray-400 hover:bg-gray-100"
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
              <span className="text-sm">+ Add</span>
            </label>
          ))}
      </div>
    </div>
  );
}
