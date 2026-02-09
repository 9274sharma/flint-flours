-- Migration: 006_order_items_insert_policy.sql
-- Date: 2026-02-09
-- Description: Add INSERT policy for order_items to allow users to create order items for their own orders

-- Allow users to insert order items for orders they own
CREATE POLICY "Users can insert order items for own orders" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );
