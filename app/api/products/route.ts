import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { generateProductSlug, generateVariantSlug } from '@/lib/utils/slug'
import { createProductSchema } from '@/lib/schemas/product'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const subBrand = searchParams.get('sub_brand')
  const category = searchParams.get('category')
  const status = searchParams.get('status') // 'active' | 'inactive' | '' (all)
  const search = searchParams.get('search')?.trim()
  const sort = searchParams.get('sort') ?? 'created_at'
  const order = searchParams.get('order') ?? 'desc'
  const includeInactive = searchParams.get('include_inactive') === 'true'
  const featured = searchParams.get('featured') === 'true'
  const limit = searchParams.get('limit')

  const supabase = await createClient()
  let query = supabase
    .from('products')
    .select(`
      *,
      product_variants (*)
    `)

  if (includeInactive) {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } else {
    query = query.eq('is_active', true)
  }

  if (subBrand) query = query.eq('sub_brand', subBrand)
  if (category) query = query.eq('category', category)

  // Status filter (admin only, when include_inactive)
  if (includeInactive && status === 'active') query = query.eq('is_active', true)
  if (includeInactive && status === 'inactive') query = query.eq('is_active', false)

  // Search for name, slug, or product id (UUID doesn't support ilike, use eq for exact id match)
  if (search) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidRegex.test(search)) {
      query = query.eq('id', search)
    } else {
      const term = `%${search}%`
      query = query.or(`name.ilike.${term},slug.ilike.${term}`)
    }
  }

  if (featured) {
    query = query.eq('is_featured', true)
    query = query.order('featured_order', { ascending: true, nullsFirst: false })
    query = query.order('created_at', { ascending: false })
  } else {
    const validSort = ['created_at', 'name'].includes(sort) ? sort : 'created_at'
    const validOrder = order === 'asc' ? 'asc' : 'desc'
    query = query.order(validSort, { ascending: validOrder === 'asc' })
  }

  if (limit) {
    const limitNum = parseInt(limit, 10)
    if (!isNaN(limitNum) && limitNum > 0) {
      query = query.limit(limitNum)
    }
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  type ProductWithVariants = { product_variants?: { is_active: boolean }[] };
  if (!includeInactive && data) {
    data.forEach((product: ProductWithVariants) => {
      if (product.product_variants) {
        product.product_variants = product.product_variants.filter(
          (v) => v.is_active === true
        )
      }
    })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createProductSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = await createClient()

  // Generate slug from product name
  const slug = generateProductSlug(parsed.data.name)

  // Check for duplicate product (same name + sub_brand)
  const { data: existingProduct } = await supabase
    .from('products')
    .select('id, name, sub_brand, is_active')
    .eq('sub_brand', parsed.data.sub_brand)
    .eq('name', parsed.data.name)
    .maybeSingle()

  if (existingProduct) {
    return NextResponse.json(
      {
        error: 'Product already exists',
        existing: {
          id: existingProduct.id,
          name: existingProduct.name,
          sub_brand: existingProduct.sub_brand,
          is_active: existingProduct.is_active,
        },
      },
      { status: 409 }
    )
  }

  // Create product
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      sub_brand: parsed.data.sub_brand,
      name: parsed.data.name,
      slug,
      category: parsed.data.category,
      hsn_code: parsed.data.hsn_code || null,
      image_urls: parsed.data.image_urls ?? [],
      is_active: parsed.data.is_active ?? true,
    })
    .select()
    .single()

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 })
  }

  // Create variants
  const variants = parsed.data.variants.map((variant) => ({
    product_id: product.id,
    name: variant.name,
    slug: generateVariantSlug(variant.name),
    description: variant.description || null,
    price: variant.price,
    discount_percent: variant.discount_percent ?? 0,
    stock: variant.stock ?? 0,
    gst_percent: variant.gst_percent ?? 0,
    ean_code: variant.ean_code || null,
    shelf_life_days: variant.shelf_life_days || null,
    is_active: variant.is_active ?? true,
  }))

  const { data: createdVariants, error: variantsError } = await supabase
    .from('product_variants')
    .insert(variants)
    .select()

  if (variantsError) {
    // Rollback: delete the product if variants fail
    await supabase.from('products').delete().eq('id', product.id)
    return NextResponse.json({ error: variantsError.message }, { status: 500 })
  }

  return NextResponse.json(
    {
      ...product,
      product_variants: createdVariants,
    },
    { status: 201 }
  )
}
