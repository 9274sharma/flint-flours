-- Run this in Supabase SQL Editor
-- Payment status: paid, pending, refunded, failed, cancelled (shipped removed)
-- Order status: placed, shipped, delivered

-- 1. Add order_status column if not exists
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_status TEXT NOT NULL DEFAULT 'placed'
  CHECK (order_status IN ('placed', 'shipped', 'delivered'));

-- 2. Migrate "shipped" (payment) to paid + order_status shipped
UPDATE public.orders
SET status = 'paid', order_status = 'shipped'
WHERE status = 'shipped';

-- 3. Payment status constraint (remove shipped)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded'));

-- 4. Indexes for filtering
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- 5. Order ID search (partial match)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS id_search TEXT GENERATED ALWAYS AS (id::text) STORED;
CREATE INDEX IF NOT EXISTS idx_orders_id_search ON public.orders(id_search);
