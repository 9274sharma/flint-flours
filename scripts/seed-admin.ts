/**
 * Seed admin users. Run after a user has signed in at least once (so they exist in public.users).
 * Usage: npx tsx scripts/seed-admin.ts
 * Reads ADMIN_EMAILS from .env.local (comma-separated).
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const adminEmails = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean)

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

if (adminEmails.length === 0) {
  console.error('Set ADMIN_EMAILS in .env (comma-separated)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seed() {
  for (const email of adminEmails) {
    const { data, error } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('email', email)
      .select()
    if (error) {
      console.warn(`Could not update ${email}:`, error.message)
    } else if (data && data.length > 0) {
      console.log(`Set ${email} as admin`)
    } else {
      console.warn(`User ${email} not found. Sign in first, then run this script.`)
    }
  }
}

seed()
