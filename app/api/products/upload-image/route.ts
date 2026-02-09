import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { validateImageFile } from '@/lib/utils/validation'
import { logger } from '@/lib/logger'

/**
 * Upload product images to Supabase Storage
 * Accepts FormData with 'file' field
 * Returns the public URL of the uploaded image
 */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    const validationError = await validateImageFile(file)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const supabase = await createClient()

    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const fileExt = file.name.split('.').pop()
    const fileName = `products/${timestamp}-${randomStr}.${fileExt}`

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('products')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      logger.error('Storage upload error', { error: error.message })
      
      // If bucket doesn't exist, return helpful error
      if (error.message.includes('Bucket not found') || error.message.includes('bucket')) {
        return NextResponse.json(
          {
            error: 'Storage bucket "products" not found. Please create it in Supabase Storage.',
            details: error.message,
          },
          { status: 500 }
        )
      }
      
      // RLS policy error
      if (error.message.includes('policy') || error.message.includes('permission') || error.message.includes('denied')) {
        return NextResponse.json(
          {
            error: 'Storage bucket RLS policy error. Please check storage bucket policies in Supabase.',
            details: error.message,
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { 
          error: error.message || 'Upload failed',
          details: JSON.stringify(error),
        },
        { status: 500 }
      )
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('products').getPublicUrl(fileName)

    return NextResponse.json({ url: publicUrl, path: data.path })
  } catch (error) {
    logger.error('Upload route error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Upload failed',
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 }
    )
  }
}
