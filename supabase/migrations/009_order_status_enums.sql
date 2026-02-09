-- Migration: 009_order_status_enums.sql
-- Payment status: paid, pending, refunded, failed, cancelled (shipped removed - use order_status)
-- Order status: placed, shipped, delivered

-- 1. Migrate existing "shipped" to paid
UPDATE public.orders SET status = 'paid' WHERE status = 'shipped';

-- 2. Add order_status column
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_status TEXT NOT NULL DEFAULT 'placed'
  CHECK (order_status IN ('placed', 'shipped', 'delivered'));

-- 3. Payment status constraint (no shipped)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded'));

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- 5. Order ID search (partial match)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS id_search TEXT GENERATED ALWAYS AS (id::text) STORED;
CREATE INDEX IF NOT EXISTS idx_orders_id_search ON public.orders(id_search);
