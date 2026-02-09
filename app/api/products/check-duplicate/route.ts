import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { checkDuplicateSchema } from '@/lib/schemas/product'

/**
 * Check if a product with the same name and sub_brand already exists
 * Used by admin form to show error and "View" button
 */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = checkDuplicateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('id, name, sub_brand, is_active')
    .eq('sub_brand', parsed.data.sub_brand)
    .eq('name', parsed.data.name)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (data) {
    return NextResponse.json({
      exists: true,
      product: {
        id: data.id,
        name: data.name,
        sub_brand: data.sub_brand,
        is_active: data.is_active,
      },
    })
  }

  return NextResponse.json({ exists: false })
}
