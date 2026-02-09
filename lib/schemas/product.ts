import { z } from "zod";
import { SUB_BRANDS, CATEGORIES } from "@/lib/constants";

export const variantSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  discount_percent: z.number().min(0).max(100).default(0),
  stock: z.number().int().min(0).default(0),
  gst_percent: z.number().min(0).max(100).default(0),
  ean_code: z.string().optional(),
  shelf_life_days: z.number().int().min(0).optional(),
  is_active: z.boolean().default(true),
});

export const createProductSchema = z.object({
  sub_brand: z.enum(SUB_BRANDS),
  name: z.string().min(1),
  category: z.enum(CATEGORIES),
  hsn_code: z.string().optional(),
  image_urls: z.array(z.string()).max(5).optional(),
  variants: z.array(variantSchema).min(1),
  is_active: z.boolean().default(true),
});

export const variantUpdateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  price: z.number().positive().optional(),
  discount_percent: z.number().min(0).max(100).optional(),
  stock: z.number().int().min(0).optional(),
  gst_percent: z.number().min(0).max(100).optional(),
  ean_code: z.string().optional().nullable(),
  shelf_life_days: z.number().int().min(0).optional().nullable(),
  is_active: z.boolean().optional(),
});

export const updateProductSchema = z.object({
  sub_brand: z.enum(SUB_BRANDS).optional(),
  name: z.string().min(1).optional(),
  category: z.enum(CATEGORIES).optional(),
  hsn_code: z.string().optional().nullable(),
  image_urls: z.array(z.string()).max(5).optional(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  featured_order: z.number().int().min(0).optional().nullable(),
  variants: z.array(variantUpdateSchema).optional(),
});

export const checkDuplicateSchema = z.object({
  sub_brand: z.enum(SUB_BRANDS),
  name: z.string().min(1),
});
