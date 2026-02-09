-- Migration: 003_fix_rls_policies.sql
-- Date: 2026-02-09
-- Description: Fix RLS policies to include WITH CHECK clause for INSERT operations
-- 
-- Issue: RLS policies were using only USING clause, which doesn't cover INSERT operations.
-- Solution: Add WITH CHECK clause to policies that need to allow INSERTs.

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;

-- Recreate products policy with WITH CHECK for INSERT
CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Recreate product_variants policy with WITH CHECK for INSERT
CREATE POLICY "Admins can manage variants" ON public.product_variants
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Recreate orders policy with WITH CHECK for INSERT
CREATE POLICY "Admins can manage orders" ON public.orders
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Also fix addresses policy to include WITH CHECK
DROP POLICY IF EXISTS "Users can manage own addresses" ON public.addresses;
CREATE POLICY "Users can manage own addresses" ON public.addresses
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
