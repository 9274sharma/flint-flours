-- Migration: 007_stock_management_function.sql
-- Date: 2026-02-09
-- Description: Create function to decrement variant stock atomically (for order processing)

-- Function to decrement variant stock
-- Uses SECURITY DEFINER to bypass RLS for stock updates during order processing
CREATE OR REPLACE FUNCTION public.decrement_variant_stock(
  variant_id UUID,
  quantity INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_stock INTEGER;
  new_stock INTEGER;
BEGIN
  -- Get current stock
  SELECT stock INTO current_stock
  FROM public.product_variants
  WHERE id = variant_id;

  IF current_stock IS NULL THEN
    RAISE EXCEPTION 'Variant not found: %', variant_id;
  END IF;

  -- Calculate new stock (ensure it doesn't go below 0)
  new_stock := GREATEST(0, current_stock - quantity);

  -- Update stock
  UPDATE public.product_variants
  SET stock = new_stock
  WHERE id = variant_id;

  RETURN new_stock;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.decrement_variant_stock(UUID, INTEGER) TO authenticated;
