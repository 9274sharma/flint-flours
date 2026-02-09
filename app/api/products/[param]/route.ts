import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { generateProductSlug, generateVariantSlug } from '@/lib/utils/slug'
import { deleteImagesFromStorage } from '@/lib/utils/storage'
import { updateProductSchema } from '@/lib/schemas/product'
import { logger } from '@/lib/logger'

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ param: string }> }
) {
  const { param } = await params
  const supabase = await createClient()
  const isUuid = uuidRegex.test(param)
  const includeInactive = request.nextUrl.searchParams.get('include_inactive') === 'true'

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

  const { data, error } = isUuid
    ? await query.eq('id', param).single()
    : await query.eq('slug', param).single()

  if (error || !data) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  type VariantRow = { is_active: boolean };
  if (!includeInactive && data.product_variants) {
    data.product_variants = data.product_variants.filter(
      (v: VariantRow) => v.is_active === true
    )
  }

  return NextResponse.json(data)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ param: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { param } = await params
  if (!uuidRegex.test(param)) {
    return NextResponse.json({ error: 'Use product ID for updates' }, { status: 400 })
  }

  const body = await request.json()
  const parsed = updateProductSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = await createClient()

  // Fetch current product to compare image URLs
  const { data: currentProduct, error: currentProductError } = await supabase
    .from('products')
    .select('image_urls')
    .eq('id', param)
    .single()

  if (currentProductError) {
    return NextResponse.json({ error: currentProductError.message }, { status: 500 })
  }

  // Always check for removed images when image_urls are being updated
  // This ensures images are deleted from storage even if removeImage() failed earlier
  if (parsed.data.image_urls !== undefined) {
    const currentUrls = (currentProduct?.image_urls as string[]) || []
    const newUrls = parsed.data.image_urls || []
    
    // Find images that were removed (present in DB but not in new array)
    const removedUrls = currentUrls.filter(url => url && !newUrls.includes(url))
    
    if (removedUrls.length > 0) {
      const deletedPaths = await deleteImagesFromStorage(supabase, removedUrls)
      if (deletedPaths.length < removedUrls.length) {
        logger.warn("Failed to delete some product images from storage", {
          productId: param,
          total: removedUrls.length,
          deleted: deletedPaths.length,
        })
      }
    }
  }

  type ProductUpdate = Record<string, unknown>;
  const productUpdate: ProductUpdate = { updated_at: new Date().toISOString() }
  if (parsed.data.sub_brand) productUpdate.sub_brand = parsed.data.sub_brand
  if (parsed.data.name) {
    productUpdate.name = parsed.data.name
    productUpdate.slug = generateProductSlug(parsed.data.name)
  }
  if (parsed.data.category) productUpdate.category = parsed.data.category
  if (parsed.data.hsn_code !== undefined) productUpdate.hsn_code = parsed.data.hsn_code
  if (parsed.data.image_urls) productUpdate.image_urls = parsed.data.image_urls
  if (parsed.data.is_active !== undefined) productUpdate.is_active = parsed.data.is_active
  if (parsed.data.is_featured !== undefined) productUpdate.is_featured = parsed.data.is_featured
  if (parsed.data.featured_order !== undefined) productUpdate.featured_order = parsed.data.featured_order

  // Update product
  const { error: productError } = await supabase
    .from('products')
    .update(productUpdate)
    .eq('id', param)
    .select()
    .single()

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 })
  }

  // Update variants if provided
  if (parsed.data.variants) {
    for (const variantUpdate of parsed.data.variants) {
      if (variantUpdate.id) {
        // Update existing variant
        const variantData: Record<string, unknown> = {}
        if (variantUpdate.name) {
          variantData.name = variantUpdate.name
          variantData.slug = generateVariantSlug(variantUpdate.name)
        }
        if (variantUpdate.description !== undefined) variantData.description = variantUpdate.description
        if (variantUpdate.price) variantData.price = variantUpdate.price
        if (variantUpdate.discount_percent !== undefined) variantData.discount_percent = variantUpdate.discount_percent
        if (variantUpdate.stock !== undefined) variantData.stock = variantUpdate.stock
        if (variantUpdate.gst_percent !== undefined) variantData.gst_percent = variantUpdate.gst_percent
        if (variantUpdate.ean_code !== undefined) variantData.ean_code = variantUpdate.ean_code
        if (variantUpdate.shelf_life_days !== undefined) variantData.shelf_life_days = variantUpdate.shelf_life_days
        if (variantUpdate.is_active !== undefined) variantData.is_active = variantUpdate.is_active

        const { error: variantError } = await supabase
          .from('product_variants')
          .update(variantData)
          .eq('id', variantUpdate.id)
          .eq('product_id', param)

        if (variantError) {
          return NextResponse.json({ error: variantError.message }, { status: 500 })
        }
      }
    }
  }

  // Fetch updated product with variants
  const { data: updatedProduct, error: fetchError } = await supabase
    .from('products')
    .select(`
      *,
      product_variants (*)
    `)
    .eq('id', param)
    .single()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  return NextResponse.json(updatedProduct)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ param: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { param } = await params
  if (!uuidRegex.test(param)) {
    return NextResponse.json({ error: 'Use product ID for delete' }, { status: 400 })
  }

  const supabase = await createClient()
  
  // First, fetch the product to get image URLs
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('image_urls')
    .eq('id', param)
    .single()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  // Delete all product images from storage
  if (product?.image_urls && Array.isArray(product.image_urls) && product.image_urls.length > 0) {
    await deleteImagesFromStorage(supabase, product.image_urls)
  }

  // Cascade delete will handle variants automatically
  const { error } = await supabase.from('products').delete().eq('id', param)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return new NextResponse(null, { status: 204 })
}
