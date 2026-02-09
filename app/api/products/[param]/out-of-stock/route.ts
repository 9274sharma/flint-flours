import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Set all variants of a product to out of stock (stock = 0)
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ param: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { param } = await params
  if (!uuidRegex.test(param)) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
  }

  const supabase = await createClient()

  // Set all variants to stock = 0
  const { error } = await supabase
    .from('product_variants')
    .update({ stock: 0 })
    .eq('product_id', param)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'Product set to out of stock' })
}
