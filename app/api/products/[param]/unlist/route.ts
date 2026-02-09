import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Unlist a product (set is_active = false)
 * Product will still exist in DB but won't appear in public API
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

  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', param)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'Product unlisted' })
}
