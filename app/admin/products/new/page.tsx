"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { SUB_BRANDS, CATEGORIES } from "@/lib/constants";

type Variant = {
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

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateCheck, setDuplicateCheck] = useState<{
    exists: boolean;
    product?: { id: string; name: string; sub_brand: string; is_active: boolean };
  } | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    sub_brand: "Flint & Flours" as const,
    name: "",
    category: "Breads" as const,
    hsn_code: "",
    image_files: [] as File[], // Store File objects instead of URLs
    image_urls: [] as string[], // Will be populated after upload on submit
    variants: [
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
    ] as Variant[],
    is_active: true,
  });

  const [uploadingImages, setUploadingImages] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]); // For local preview
  const previewUrlsRef = useRef<string[]>([]);

  // Update ref when previews change
  useEffect(() => {
    previewUrlsRef.current = imagePreviews;
  }, [imagePreviews]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []); // Only run on unmount

  // Check for duplicate product
  const checkDuplicate = useCallback(
    async (name: string, subBrand: typeof form.sub_brand) => {
      if (!name.trim()) {
        setDuplicateCheck(null);
        return;
      }

      setCheckingDuplicate(true);
      try {
        const res = await fetch("/api/products/check-duplicate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), sub_brand: subBrand }),
        });
        const data = await res.json();
        if (res.ok) {
          setDuplicateCheck(data);
        }
      } catch {
        // Silently fail duplicate check
      } finally {
        setCheckingDuplicate(false);
      }
    },
    [form]
  );

  // Handle product name change with duplicate check
  const handleNameChange = (name: string) => {
    setForm((prev) => ({ ...prev, name }));
    checkDuplicate(name, form.sub_brand);
  };

  // Handle sub-brand change (re-check duplicate)
  const handleSubBrandChange = (subBrand: typeof form.sub_brand) => {
    setForm((prev) => ({ ...prev, sub_brand: subBrand }));
    if (form.name.trim()) {
      checkDuplicate(form.name, subBrand);
    }
  };

  // Handle image selection (store locally, don't upload yet)
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    
    if (form.image_files.length + newFiles.length > 5) {
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

    // Store files
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
    // Revoke preview URL to free memory
    URL.revokeObjectURL(imagePreviews[index]);
    
    setForm((prev) => ({
      ...prev,
      image_files: prev.image_files.filter((_, i) => i !== index),
    }));
    
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload images to storage (called on form submit)
  const uploadImages = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];

    setUploadingImages(true);
    try {
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

      const urls = await Promise.all(uploadPromises);
      return urls;
    } finally {
      setUploadingImages(false);
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

    // Check if duplicate exists
    if (duplicateCheck?.exists) {
      setError(
        `Product "${duplicateCheck.product?.name}" already exists in ${duplicateCheck.product?.sub_brand}. Click "View" to edit it.`
      );
      return;
    }

    setSaving(true);
    try {
      // Step 1: Upload images first
      let imageUrls: string[] = [];
      if (form.image_files.length > 0) {
        try {
          imageUrls = await uploadImages(form.image_files);
        } catch (uploadError) {
          throw new Error(
            uploadError instanceof Error 
              ? `Image upload failed: ${uploadError.message}` 
              : "Image upload failed"
          );
        }
      }

      // Step 2: Create product with uploaded image URLs
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sub_brand: form.sub_brand,
          name: form.name.trim(),
          category: form.category,
          hsn_code: form.hsn_code || undefined,
          image_urls: imageUrls,
          variants: form.variants.map((v) => ({
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
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        // If product creation fails, uploaded images will remain in storage
        // (This is acceptable - they can be cleaned up manually if needed)
        if (res.status === 409 && data.existing) {
          // Duplicate found on submit
          setDuplicateCheck({
            exists: true,
            product: data.existing,
          });
          throw new Error(
            `Product "${data.existing.name}" already exists in ${data.existing.sub_brand}. Click "View" to edit it.`
          );
        }
        throw new Error(data.error?.message || data.error || "Failed to create");
      }

      // Clean up preview URLs
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Add product</h1>
      <form onSubmit={handleSubmit} className="mt-6 max-w-4xl space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {duplicateCheck?.exists && duplicateCheck.product && (
          <div className="rounded-lg border-2 border-amber-500 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">
              Product &quot;{duplicateCheck.product.name}&quot; already exists in{" "}
              {duplicateCheck.product.sub_brand}
              {!duplicateCheck.product.is_active && " (unlisted)"}.
            </p>
            <Link
              href={`/admin/products/${duplicateCheck.product.id}/edit`}
              className="mt-2 inline-block rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              View Product
            </Link>
          </div>
        )}

        {/* Basic Product Info */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="sub_brand_new" className="block text-sm font-medium text-gray-900">
              Sub-brand *
            </label>
            <select
              id="sub_brand_new"
              value={form.sub_brand}
              onChange={(e) =>
                handleSubBrandChange(e.target.value as typeof form.sub_brand)
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
            <label htmlFor="category_new" className="block text-sm font-medium text-gray-900">
              Category *
            </label>
            <select
              id="category_new"
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
          <label className="block text-sm font-medium text-gray-900">
            Product Name * {checkingDuplicate && <span className="text-gray-500">(checking...)</span>}
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            placeholder="e.g. Sourdough - Rustic"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
          <p className="mt-1 text-xs text-gray-500">
            Slug will be auto-generated (e.g., SOURDOUGH_RUSTIC)
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
            Product Images (max 5) {uploadingImages && <span className="text-gray-500">(uploading...)</span>}
          </label>
          <div className="mt-2 space-y-2">
            <input
              ref={fileInputRef}
              id="product_images_new"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              disabled={uploadingImages || saving || form.image_files.length >= 5}
              aria-label="Upload product images"
              className="block w-full text-sm text-gray-900 file:mr-4 file:rounded-lg file:border-0 file:bg-stone-800 file:px-4 file:py-2 file:text-white file:hover:bg-stone-900 disabled:opacity-50"
            />
            <p className="text-xs text-gray-500">
              Images will be uploaded when you click &quot;Create product&quot;
            </p>
            {form.image_files.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                {form.image_files.map((file, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={imagePreviews[index]}
                      alt={`Preview ${index + 1}`}
                      width={96}
                      height={96}
                      className="h-24 w-full rounded-lg object-cover border border-gray-300"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      disabled={uploadingImages || saving}
                      className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600 disabled:opacity-50"
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                    <p className="mt-1 text-xs text-gray-500 truncate" title={file.name}>
                      {file.name}
                    </p>
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
                    Variant {index + 1}
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
                    <label htmlFor={`variant-name-new-${index}`} className="block text-xs font-medium text-gray-700">
                      Variant Name *
                    </label>
                    <input
                      id={`variant-name-new-${index}`}
                      type="text"
                      value={variant.name}
                      onChange={(e) =>
                        updateVariant(index, "name", e.target.value)
                      }
                      placeholder="e.g. Plain, Jalapeno-Cheese, 500 gms"
                      required
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    />
                  </div>

                  <div>
                    <label htmlFor={`variant-price-new-${index}`} className="block text-xs font-medium text-gray-700">
                      Price (₹) *
                    </label>
                    <input
                      id={`variant-price-new-${index}`}
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
                    <label htmlFor={`variant-discount-new-${index}`} className="block text-xs font-medium text-gray-700">
                      Discount (%)
                    </label>
                    <input
                      id={`variant-discount-new-${index}`}
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
                    <label htmlFor={`variant-stock-new-${index}`} className="block text-xs font-medium text-gray-700">
                      Stock
                    </label>
                    <input
                      id={`variant-stock-new-${index}`}
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
                    <label htmlFor={`variant-gst-new-${index}`} className="block text-xs font-medium text-gray-700">
                      GST (%)
                    </label>
                    <input
                      id={`variant-gst-new-${index}`}
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
                    <label htmlFor={`variant-ean-new-${index}`} className="block text-xs font-medium text-gray-700">
                      EAN Code
                    </label>
                    <input
                      id={`variant-ean-new-${index}`}
                      type="text"
                      value={variant.ean_code}
                      onChange={(e) =>
                        updateVariant(index, "ean_code", e.target.value)
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    />
                  </div>

                  <div>
                    <label htmlFor={`variant-shelf-life-new-${index}`} className="block text-xs font-medium text-gray-700">
                      Shelf Life (days)
                    </label>
                    <input
                      id={`variant-shelf-life-new-${index}`}
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
                  <label className="block text-xs font-medium text-gray-700">
                    Description/Ingredients
                  </label>
                  <textarea
                    value={variant.description}
                    onChange={(e) =>
                      updateVariant(index, "description", e.target.value)
                    }
                    rows={2}
                    placeholder="Ingredients, description, etc."
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving || duplicateCheck?.exists}
            className="rounded-lg bg-stone-800 px-4 py-2 text-white hover:bg-stone-900 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Create product"}
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
