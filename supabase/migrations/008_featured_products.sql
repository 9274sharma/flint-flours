-- Migration: 008_featured_products.sql
-- Description: Add is_featured and featured_order columns for homepage featured products

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_order INTEGER;

CREATE INDEX IF NOT EXISTS idx_products_is_featured 
  ON public.products(is_featured) 
  WHERE is_featured = true;

COMMENT ON COLUMN public.products.is_featured IS 'When true, product appears in Featured Products section on homepage';
COMMENT ON COLUMN public.products.featured_order IS 'Display order in Featured section (lower = first)';
