-- Migration: 002_products_variants_schema.sql
-- Date: 2026-02-09
-- Description: Refactor products to support multiple variants per product
-- 
-- Changes:
-- 1. Remove variant-specific columns from products table
-- 2. Create product_variants table for variant-specific data
-- 3. Update order_items to reference variant_id
-- 4. Update RLS policies
-- 5. Add indexes

-- Step 1: Drop old indexes that reference columns we're removing
DROP INDEX IF EXISTS public.idx_products_variant;
DROP INDEX IF EXISTS public.idx_products_slug; -- Will recreate with composite unique

-- Step 2: Drop old unique constraint on slug (will recreate with sub_brand)
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_slug_key;

-- Step 3: Remove variant-specific columns from products table
ALTER TABLE public.products
  DROP COLUMN IF EXISTS variant,
  DROP COLUMN IF EXISTS price,
  DROP COLUMN IF EXISTS compare_at_price,
  DROP COLUMN IF EXISTS stock,
  DROP COLUMN IF EXISTS gst_percent,
  DROP COLUMN IF EXISTS shelf_life_days,
  DROP COLUMN IF EXISTS ean_code,
  DROP COLUMN IF EXISTS description;

-- Step 4: Add hsn_code if it doesn't exist (it should exist, but safe to check)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'hsn_code'
  ) THEN
    ALTER TABLE public.products ADD COLUMN hsn_code TEXT;
  END IF;
END $$;

-- Step 5: Add constraint to ensure slug is unique per sub_brand
ALTER TABLE public.products
  ADD CONSTRAINT products_sub_brand_slug_unique UNIQUE (sub_brand, slug);

-- Step 6: Create product_variants table
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  discount_percent NUMERIC(4, 2) DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  gst_percent NUMERIC(4, 2) DEFAULT 0 CHECK (gst_percent >= 0 AND gst_percent <= 100),
  ean_code TEXT UNIQUE,
  shelf_life_days INTEGER CHECK (shelf_life_days >= 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT product_variants_product_slug_unique UNIQUE (product_id, slug)
);

-- Step 7: Add indexes for product_variants
CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX idx_product_variants_ean_code ON public.product_variants(ean_code);
CREATE INDEX idx_product_variants_is_active ON public.product_variants(is_active);
CREATE INDEX idx_product_variants_slug ON public.product_variants(slug);

-- Step 8: Update order_items to reference variant_id instead of product_id
-- First, add variant_id column
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL;

-- Step 9: Recreate products indexes
CREATE INDEX IF NOT EXISTS idx_products_sub_brand_slug ON public.products(sub_brand, slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

-- Step 10: Enable RLS on product_variants
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Step 11: RLS policies for product_variants
-- Public can read active variants of active products
CREATE POLICY "Variants are viewable by everyone" ON public.product_variants
  FOR SELECT USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id AND p.is_active = true
    )
  );

-- Admins can manage all variants
CREATE POLICY "Admins can manage variants" ON public.product_variants
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Step 12: Update order_items RLS to allow reading via variants
-- Keep existing policy, add variant-based access
CREATE POLICY "Users can read own order items via variants" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );

-- Step 13: Add function to calculate final price (price after discount)
CREATE OR REPLACE FUNCTION public.get_variant_final_price(variant_price DECIMAL, discount_pct NUMERIC)
RETURNS DECIMAL AS $$
BEGIN
  RETURN variant_price - (variant_price * discount_pct / 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 14: Add trigger to update updated_at on product_variants
CREATE OR REPLACE FUNCTION public.update_product_variants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_variants_updated_at();

-- Step 15: Add trigger to update products.updated_at when variants change
CREATE OR REPLACE FUNCTION public.update_product_on_variant_change()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET updated_at = NOW()
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_on_variant_insert
  AFTER INSERT ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_on_variant_change();

CREATE TRIGGER update_product_on_variant_update
  AFTER UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_on_variant_change();

CREATE TRIGGER update_product_on_variant_delete
  AFTER DELETE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_on_variant_change();
