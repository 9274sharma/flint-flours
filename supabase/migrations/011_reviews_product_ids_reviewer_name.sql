-- Migration: 011_reviews_product_ids_reviewer_name.sql
-- Description: Change reviews to one per order, applies to all products (product_ids array)
--              Add reviewer_name column for display
--
-- Changes:
-- 1. Add product_ids column (UUID array)
-- 2. Migrate existing data: product_ids = array of product_id
-- 3. Drop old constraint, index, and product_id column
-- 4. Add unique (user_id, order_id) for one review per order
-- 5. Add reviewer_name column
-- 6. Add GIN index for product_ids queries

-- 1. Add product_ids column
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS product_ids UUID[] DEFAULT '{}';

-- 2. Migrate existing data: set product_ids = array of product_id (if product_id exists)
UPDATE public.reviews SET product_ids = ARRAY[product_id] 
WHERE product_id IS NOT NULL 
  AND (product_ids IS NULL OR product_ids = '{}');

-- 3. Drop old constraint, index, and product_id
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_product_id_key;
DROP INDEX IF EXISTS public.idx_reviews_product_id;
ALTER TABLE public.reviews DROP COLUMN IF EXISTS product_id;

-- 4. Add unique (user_id, order_id) for one review per order (partial: only when order_id set)
CREATE UNIQUE INDEX IF NOT EXISTS reviews_user_order_unique 
  ON public.reviews(user_id, order_id) 
  WHERE order_id IS NOT NULL;

-- 5. Add reviewer_name column
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS reviewer_name TEXT;

-- 6. Index for product page queries (contains product_id)
CREATE INDEX IF NOT EXISTS idx_reviews_product_ids 
  ON public.reviews USING GIN (product_ids);
