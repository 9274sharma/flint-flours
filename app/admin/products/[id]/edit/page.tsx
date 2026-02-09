"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { SUB_BRANDS, CATEGORIES } from "@/lib/constants";

type Variant = {
  id?: string;
  name: string;
  description: string;
  price: string;
  discount_percent: string;
  stock: string;
  gst_percent: string;
  ean_code: string;
  shelf_life_days: string;
  is_active: boolean;
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [form, setForm] = useState({
    sub_brand: "Flint & Flours" as const,
    name: "",
    category: "Breads" as const,
    hsn_code: "",
    image_urls: [] as string[], // Existing URLs from database
    image_files: [] as File[], // New files to upload
    variants: [] as Variant[],
    is_active: true,
    is_featured: false,
    featured_order: null as number | null,
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]); // Preview URLs for new files
  const previewUrlsRef = useRef<string[]>([]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    previewUrlsRef.current = imagePreviews;
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${id}?include_inactive=true`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();

        // Transform variants from API to form format
        type VariantApi = { id: string; name: string; description?: string | null; price: number; discount_percent: number; stock: number; gst_percent: number; ean_code?: string | null; shelf_life_days?: number | null; is_active: boolean };
        const variants: Variant[] = (data.product_variants || []).map((v: VariantApi) => ({
          id: v.id,
          name: v.name,
          description: v.description || "",
          price: String(v.price),
          discount_percent: String(v.discount_percent || 0),
          stock: String(v.stock || 0),
          gst_percent: String(v.gst_percent || 0),
          ean_code: v.ean_code || "",
          shelf_life_days: v.shelf_life_days ? String(v.shelf_life_days) : "",
          is_active: v.is_active ?? true,
        }));

        const existingImageUrls = Array.isArray(data.image_urls) ? data.image_urls : [];
        setForm({
          sub_brand: data.sub_brand,
          name: data.name,
          category: data.category,
          hsn_code: data.hsn_code || "",
          image_urls: existingImageUrls, // Existing URLs from database
          image_files: [], // No new files initially
          variants: variants.length > 0 ? variants : [
            {
              name: "",
              description: "",
              price: "",
              discount_percent: "0",
              stock: "0",
              gst_percent: "0",
              ean_code: "",
              shelf_life_days: "",
              is_active: true,
            },
          ],
          is_active: data.is_active ?? true,
          is_featured: data.is_featured ?? false,
          featured_order: data.featured_order ?? null,
        });
      } catch {
        setError("Product not found");
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  // Helper function to upload images
  const uploadImages = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/products/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      return data.url;
    });

    return Promise.all(uploadPromises);
  };

  // Handle image selection (store locally, don't upload yet)
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const totalImages = form.image_urls.length + form.image_files.length + newFiles.length;
    
    if (totalImages > 5) {
      setError("Maximum 5 images allowed per product");
      return;
    }

    // Validate file types
    for (const file of newFiles) {
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not an image file`);
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} is larger than 5MB`);
        return;
      }
    }

    setError(null);

    // Store files locally
    setForm((prev) => ({
      ...prev,
      image_files: [...prev.image_files, ...newFiles],
    }));

    // Create preview URLs
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    const totalExisting = form.image_urls.length;
    
    if (index < totalExisting) {
      // Remove existing URL from form state only (UI update).
      // Storage deletion happens when user clicks "Save changes" via PUT endpoint.
      setForm((prev) => ({
        ...prev,
        image_urls: prev.image_urls.filter((_, i) => i !== index),
      }));
    } else {
      // Remove new file (not yet uploaded, just remove from local state)
      const fileIndex = index - totalExisting;
      // Revoke preview URL
      URL.revokeObjectURL(imagePreviews[fileIndex]);
      
      setForm((prev) => ({
        ...prev,
        image_files: prev.image_files.filter((_, i) => i !== fileIndex),
      }));
      setImagePreviews((prev) => prev.filter((_, i) => i !== fileIndex));
    }
  };

  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          name: "",
          description: "",
          price: "",
          discount_percent: "0",
          stock: "0",
          gst_percent: "0",
          ean_code: "",
          shelf_life_days: "",
          is_active: true,
        },
      ],
    }));
  };

  const removeVariant = (index: number) => {
    if (form.variants.length === 1) {
      setError("At least one variant is required");
      return;
    }
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const updateVariant = (index: number, field: keyof Variant, value: string | boolean) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === index ? { ...v, [field]: value } : v
      ),
    }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate variants
    if (form.variants.length === 0) {
      setError("At least one variant is required");
      return;
    }

    for (const variant of form.variants) {
      if (!variant.name.trim()) {
        setError("All variants must have a name");
        return;
      }
      if (!variant.price || parseFloat(variant.price) <= 0) {
        setError("All variants must have a valid price");
        return;
      }
    }

    setSaving(true);
    setUploadingImages(true);
    try {
      // Step 1: Upload new images first
      let allImageUrls = [...form.image_urls]; // Start with existing URLs
      
      if (form.image_files.length > 0) {
        try {
          const newUrls = await uploadImages(form.image_files);
          allImageUrls = [...allImageUrls, ...newUrls];
        } catch (uploadError) {
          throw new Error(
            uploadError instanceof Error 
              ? `Image upload failed: ${uploadError.message}` 
              : "Image upload failed"
          );
        }
      }

      // Step 2: Update product with all image URLs (existing + newly uploaded)
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sub_brand: form.sub_brand,
          name: form.name.trim(),
          category: form.category,
          hsn_code: form.hsn_code || undefined,
          image_urls: allImageUrls,
          variants: form.variants.map((v) => ({
            id: v.id, // Include ID for existing variants
            name: v.name.trim(),
            description: v.description.trim() || undefined,
            price: parseFloat(v.price),
            discount_percent: parseFloat(v.discount_percent) || 0,
            stock: parseInt(v.stock, 10) || 0,
            gst_percent: parseFloat(v.gst_percent) || 0,
            ean_code: v.ean_code.trim() || undefined,
            shelf_life_days: v.shelf_life_days ? parseInt(v.shelf_life_days, 10) : undefined,
            is_active: v.is_active,
          })),
          is_active: form.is_active,
          is_featured: form.is_featured,
          featured_order: form.featured_order ?? undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.error?.message || data.error || "Failed to update"
        );
      // Cleanup preview URLs
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
      setImagePreviews([]);
      
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update product");
    } finally {
      setSaving(false);
      setUploadingImages(false);
    }
  }

  async function handleOutOfStock() {
    if (!confirm("Set all variants to out of stock (stock = 0)?")) return;

    try {
      const res = await fetch(`/api/products/${id}/out-of-stock`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to set out of stock");
      }
      router.refresh();
      alert("Product set to out of stock");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set out of stock");
    }
  }

  async function handleUnlist() {
    if (!confirm("Unlist this product? It will be hidden from the shop but remain in the database.")) return;

    try {
      const res = await fetch(`/api/products/${id}/unlist`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to unlist");
      }
      setForm((prev) => ({ ...prev, is_active: false }));
      alert("Product unlisted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlist product");
    }
  }

  async function handleList() {
    try {
      const res = await fetch(`/api/products/${id}/list`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to list");
      }
      setForm((prev) => ({ ...prev, is_active: true }));
      alert("Product listed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to list product");
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        "Are you sure you want to permanently delete this product? This action cannot be undone."
      )
    )
      return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit product</h1>
        <p className="mt-4 text-gray-700">Loading...</p>
      </div>
    );
  }

  if (error && !form.name) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit product</h1>
        <p className="mt-4 text-amber-600">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Edit product</h1>
      <form onSubmit={handleSubmit} className="mt-6 max-w-4xl space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Basic Product Info */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="sub_brand" className="block text-sm font-medium text-gray-900">
              Sub-brand *
            </label>
            <select
              id="sub_brand"
              value={form.sub_brand}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  sub_brand: e.target.value as typeof form.sub_brand,
                }))
              }
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900"
            >
              {SUB_BRANDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-900">
              Category *
            </label>
            <select
              id="category"
              value={form.category}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  category: e.target.value as typeof form.category,
                }))
              }
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="product_name" className="block text-sm font-medium text-gray-900">
            Product Name *
          </label>
          <input
            id="product_name"
            type="text"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
          <p className="mt-1 text-xs text-gray-500">
            Slug will be auto-generated when saved
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900">
            HSN Code
          </label>
          <input
            type="text"
            value={form.hsn_code}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, hsn_code: e.target.value }))
            }
            placeholder="e.g. 19053100/19059040"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-900">
            Product Images (max 5)
          </label>
          <div className="mt-2 space-y-2">
            <input
              ref={fileInputRef}
              id="product_images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              disabled={uploadingImages || saving || (form.image_urls.length + form.image_files.length) >= 5}
              aria-label="Upload product images"
              className="block w-full text-sm text-gray-900 file:mr-4 file:rounded-lg file:border-0 file:bg-stone-800 file:px-4 file:py-2 file:text-white file:hover:bg-stone-900"
            />
            {uploadingImages && (
              <p className="text-sm text-gray-600">Uploading images...</p>
            )}
            {(form.image_urls.length > 0 || form.image_files.length > 0) && (
              <div className="grid grid-cols-5 gap-2">
                {/* Display existing URLs */}
                {form.image_urls.map((url, index) => (
                  <div key={`existing-${index}`} className="relative">
                    <Image
                      src={url}
                      alt={`Product ${index + 1}`}
                      width={96}
                      height={96}
                      className="h-24 w-full rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {/* Display new file previews */}
                {form.image_files.map((file, index) => (
                  <div key={`new-${index}`} className="relative">
                    <Image
                      src={imagePreviews[index]}
                      alt={`New image ${index + 1}`}
                      width={96}
                      height={96}
                      className="h-24 w-full rounded-lg object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(form.image_urls.length + index)}
                      className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Variants */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-900">
              Variants * (at least one required)
            </label>
            <button
              type="button"
              onClick={addVariant}
              className="text-sm text-stone-800 hover:text-stone-900"
            >
              + Add Variant
            </button>
          </div>

          <div className="mt-4 space-y-6">
            {form.variants.map((variant, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-300 p-4"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">
                    Variant {index + 1} {variant.id && <span className="text-xs text-gray-500">(ID: {variant.id.slice(0, 8)}...)</span>}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateVariant(index, "stock", "0")}
                      className="text-sm text-amber-600 hover:text-amber-700"
                    >
                      Out of Stock
                    </button>
                    {form.variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor={`variant-name-${index}`} className="block text-xs font-medium text-gray-700">
                      Variant Name *
                    </label>
                    <input
                      id={`variant-name-${index}`}
                      type="text"
                      value={variant.name}
                      onChange={(e) =>
                        updateVariant(index, "name", e.target.value)
                      }
                      required
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    />
                  </div>

                  <div>
                    <label htmlFor={`variant-price-${index}`} className="block text-xs font-medium text-gray-700">
                      Price (₹) *
                    </label>
                    <input
                      id={`variant-price-${index}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={variant.price}
                      onChange={(e) =>
                        updateVariant(index, "price", e.target.value)
                      }
                      required
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    />
                  </div>

                  <div>
                    <label htmlFor={`variant-discount-${index}`} className="block text-xs font-medium text-gray-700">
                      Discount (%)
                    </label>
                    <input
                      id={`variant-discount-${index}`}
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={variant.discount_percent}
                      onChange={(e) =>
                        updateVariant(index, "discount_percent", e.target.value)
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <p className="text-xs font-medium text-gray-700">
                      Final price (after discount)
                    </p>
                    <p className="mt-1 text-sm font-semibold text-green-700">
                      ₹
                      {(
                        parseFloat(variant.price || "0") -
                        (parseFloat(variant.price || "0") *
                          parseFloat(variant.discount_percent || "0")) /
                        100
                      ).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>

                  <div>
                    <label htmlFor={`variant-stock-${index}`} className="block text-xs font-medium text-gray-700">
                      Stock
                    </label>
                    <input
                      id={`variant-stock-${index}`}
                      type="number"
                      min="0"
                      value={variant.stock}
                      onChange={(e) =>
                        updateVariant(index, "stock", e.target.value)
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    />
                  </div>

                  <div>
                    <label htmlFor={`variant-gst-${index}`} className="block text-xs font-medium text-gray-700">
                      GST (%)
                    </label>
                    <input
                      id={`variant-gst-${index}`}
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={variant.gst_percent}
                      onChange={(e) =>
                        updateVariant(index, "gst_percent", e.target.value)
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    />
                  </div>

                  <div>
                    <label htmlFor={`variant-ean-${index}`} className="block text-xs font-medium text-gray-700">
                      EAN Code
                    </label>
                    <input
                      id={`variant-ean-${index}`}
                      type="text"
                      value={variant.ean_code}
                      onChange={(e) =>
                        updateVariant(index, "ean_code", e.target.value)
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    />
                  </div>

                  <div>
                    <label htmlFor={`variant-shelf-life-${index}`} className="block text-xs font-medium text-gray-700">
                      Shelf Life (days)
                    </label>
                    <input
                      id={`variant-shelf-life-${index}`}
                      type="number"
                      min="0"
                      value={variant.shelf_life_days}
                      onChange={(e) =>
                        updateVariant(index, "shelf_life_days", e.target.value)
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`variant-active-${index}`}
                      checked={variant.is_active}
                      onChange={(e) =>
                        updateVariant(index, "is_active", e.target.checked)
                      }
                      className="rounded border-gray-300"
                    />
                    <label
                      htmlFor={`variant-active-${index}`}
                      className="text-xs text-gray-700"
                    >
                      Active
                    </label>
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor={`variant-description-${index}`} className="block text-xs font-medium text-gray-700">
                    Description/Ingredients
                  </label>
                  <textarea
                    id={`variant-description-${index}`}
                    value={variant.description}
                    onChange={(e) =>
                      updateVariant(index, "description", e.target.value)
                    }
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Product Status */}
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, is_active: e.target.checked }))
              }
              className="rounded border-gray-300"
            />
            <label htmlFor="is_active" className="text-sm text-gray-900">
              Active (visible in shop)
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_featured"
              checked={form.is_featured}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, is_featured: e.target.checked }))
              }
              className="rounded border-gray-300"
            />
            <label htmlFor="is_featured" className="text-sm text-gray-900">
              Featured (show on homepage)
            </label>
          </div>
          {form.is_featured && (
            <div className="flex items-center gap-2">
              <label htmlFor="featured_order" className="text-sm text-gray-700">
                Order:
              </label>
              <input
                id="featured_order"
                type="number"
                min={0}
                value={form.featured_order ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    featured_order: val === "" ? null : parseInt(val, 10) || 0,
                  }));
                }}
                placeholder="0"
                className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-900"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-stone-800 px-4 py-2 text-white hover:bg-stone-900 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
          <button
            type="button"
            onClick={handleOutOfStock}
            className="rounded-lg border border-amber-600 bg-white px-4 py-2 text-amber-700 hover:bg-amber-50"
          >
            Out of Stock
          </button>
          {form.is_active ? (
            <button
              type="button"
              onClick={handleUnlist}
              className="rounded-lg border border-gray-600 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Unlist
            </button>
          ) : (
            <button
              type="button"
              onClick={handleList}
              className="rounded-lg border border-green-600 bg-white px-4 py-2 text-green-700 hover:bg-green-50"
            >
              List Product
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg border border-red-600 bg-white px-4 py-2 text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete product"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
