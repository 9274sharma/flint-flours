# Flint & Flours Ecommerce

Ecommerce website for Flint & Flours (www.flintandflours.com) — millet-based bakery products.

---

## Table of Contents

- [Architecture](#architecture)
- [Setup](#setup)
- [Deployment](#deployment)
- [Changing admin email](#changing-admin-email)
- [Security](#security)
- [Technology Stack](#technology-stack)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Database Migrations](#database-migrations)
- [Environment Variables](#environment-variables)
- [Clone and set up this project](#clone-and-set-up-this-project)

---

## Architecture

### Frontend (Next.js App Router)

```
app/
├── (public pages)
│   ├── page.tsx              # Homepage
│   ├── about/                # About, Founder, Story, Why Millets
│   ├── shop/                 # Product listing & product detail
│   ├── login/                # Google OAuth sign-in
│   └── fonts/                # Geist fonts
├── (protected - auth required)
│   ├── account/              # User account & order history
│   ├── cart/                 # Shopping cart
│   ├── checkout/             # Checkout flow
│   └── orders/               # Order list & success page
├── (admin - admin role required)
│   └── admin/
│       ├── products/         # CRUD products & variants
│       ├── orders/           # Order management
│       └── craft/             # Our Craft gallery images
├── api/                      # API routes
├── auth/callback/            # OAuth callback
├── layout.tsx
└── globals.css
```

**Key frontend concepts:**

- **Server Components (default)** — Most pages fetch data server-side.
- **Client Components** — Used for interactivity (cart, forms, modals).
- **Context providers** — `CartContext` (cart state), `ToastContext` (notifications).
- **Middleware** — Session refresh, route protection (auth required for `/account`, `/cart`, `/checkout`, `/orders`; admin required for `/admin`).

### Backend (Next.js API Routes + Supabase)

```
app/api/
├── addresses/         # CRUD user addresses
├── cart/              # Cart sync (add, update, remove)
├── craft/
│   └── images/        # Upload/delete craft gallery images
├── orders/
│   ├── route.ts       # List orders
│   ├── create/        # Create order
│   ├── create-demo/   # Demo order (no payment)
│   ├── razorpay/      # Razorpay order creation
│   ├── verify/        # Payment verification
│   └── [id]/          # Order by ID
├── products/
│   ├── route.ts       # List/create products
│   ├── upload-image/  # Product image upload
│   ├── delete-image/  # Remove product image
│   ├── check-duplicate/
│   └── [param]/       # Get, update, delete, list, unlist, out-of-stock
└── reviews/
    ├── route.ts       # List reviews (by product_ids)
    └── create/        # Create/update review (one per order)
```

**Data flow:**

1. **Auth** — Supabase Auth (Google OAuth). User record synced to `public.users` via trigger.
2. **Database** — PostgreSQL via Supabase. RLS (Row Level Security) enforces access control.
3. **Storage** — Supabase Storage buckets: `products` (product images), `craft` (gallery images).
4. **Payments** — Razorpay for order creation and verification.

---

## Setup

### Prerequisites

- Node.js 18+
- npm
- Supabase account
- Google OAuth credentials (for auth)

### 1. Clone and install

```bash
git clone <repository-url>
cd ecommerce
npm install
```

### 2. Environment variables

Copy the example env and fill in values:

```bash
cp .env.example .env.local
```

Edit `.env.local` — see [Environment Variables](#environment-variables) for details.

### 3. Database setup

Run migrations in **Supabase SQL Editor** in order:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**
2. Run each file in `supabase/migrations/` in numeric order:
   - `001_initial_schema.sql`
   - `002_products_variants_schema.sql`
   - `003_fix_rls_policies.sql`
   - `004_storage_rls_policies.sql`
   - `005_cart_table.sql`
   - `006_order_items_insert_policy.sql`
   - `007_stock_management_function.sql`
   - `008_featured_products.sql`
   - `009_order_status_enums.sql`
   - `010_craft_storage_policies.sql`
   - `011_reviews_product_ids_reviewer_name.sql`

### 4. Storage buckets

Create two buckets in **Supabase → Storage**:

| Bucket   | Public | File size | Allowed MIME types            |
|----------|--------|-----------|-------------------------------|
| `products` | Yes  | 5MB       | image/jpeg, image/png, image/webp, image/gif |
| `craft`    | Yes  | 5MB       | image/jpeg, image/png, image/webp, image/gif |

RLS policies for these buckets are applied by migrations `004` and `010`.

### 5. Auth provider (Google)

1. Supabase Dashboard → **Authentication** → **Providers** → Google
2. Enable Google, add Client ID and Secret from [Google Cloud Console](https://console.cloud.google.com/)
3. Add redirect URL: `https://<project-ref>.supabase.co/auth/v1/callback`

### 6. Seed admin users

After signing in at least once with Google:

```bash
npx tsx scripts/seed-admin.ts
```

Or set `ADMIN_EMAILS` in `.env.local` (comma-separated) and run the script.

### 7. Run locally

```bash
npm run dev
```

App runs at **http://localhost:3001**.

---

## Deployment

### Where to set environment variables

**Never commit `.env` or `.env.local`** — they are in `.gitignore`. Set env vars in your hosting dashboard so they are available at **build time** and **runtime**.

| Platform | Where to add env vars |
|----------|------------------------|
| **Vercel** | Project → **Settings** → **Environment Variables**. Add each variable; choose Production / Preview / Development. Redeploy after adding. |
| **Netlify** | Site → **Site configuration** → **Environment variables**. |
| **Railway / Render / etc.** | Project **Settings** or **Variables**; paste from `.env.example`. |

**Required for build:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (and optionally `NEXT_PUBLIC_SITE_URL`) are used at build. All others are runtime-only but should still be set in the host so API routes and server code work.

**After deploy:** Update Supabase Auth redirect URLs to include your production URL (e.g. `https://your-app.vercel.app/auth/callback`).

---

## Changing admin email

Admins are determined by the `role` column in `public.users` (value `'admin'`).

**Option 1: Seed script (recommended)**

1. In your host’s env vars (or locally in `.env.local`), set:
   ```bash
   ADMIN_EMAILS=admin@example.com,other@example.com
   ```
   (Comma-separated, no spaces or with spaces — the script trims them.)
2. Ensure that user has signed in at least once (so a row exists in `public.users`).
3. Run the seed script (locally with env set, or in a one-off deploy/CLI step):
   ```bash
   npx tsx scripts/seed-admin.ts
   ```
   The script sets `role = 'admin'` for every email in `ADMIN_EMAILS`.

**Option 2: Database**

In Supabase **SQL Editor**:

```sql
-- Grant admin to one email
UPDATE public.users SET role = 'admin' WHERE email = 'admin@example.com';

-- Revoke admin
UPDATE public.users SET role = 'customer' WHERE email = 'former-admin@example.com';
```

To add a new admin: add their email to `ADMIN_EMAILS`, have them sign in once, then run the seed script again.

---

## Security

### 1. Authentication & authorization

- **Supabase Auth** — Google OAuth. Session handled via cookies.
- **Middleware** — Protects `/account`, `/cart`, `/checkout`, `/orders` (requires login).
- **Admin routes** — `/admin/*` requires `role = 'admin'` in `public.users`.
- **API routes** — Admin endpoints use `requireAdmin()`; user endpoints verify `auth.uid()`.

### 2. Row Level Security (RLS)

All tables have RLS enabled. Policies enforce:

- **products** — Public read for active products; admins have full access.
- **product_variants** — Same as products.
- **addresses** — Users manage only their own rows.
- **orders** — Users read their own; admins manage all.
- **order_items** — Users read via their orders; users insert for their own orders.
- **cart_items** — Users CRUD only their own cart.
- **reviews** — Public read; users insert/update their own.
- **users** — Users can read their own row.
- **storage.objects** — Public read for `products` and `craft` buckets; only admins can insert/update/delete.

### 3. Rate limiting

API routes use in-memory rate limiting (client IP or fallback identifier):

| Route                    | Limit   |
|--------------------------|---------|
| Order create             | 10/60s  |
| Order verify             | 20/60s  |
| Auth callback            | 20/60s  |
| Addresses CRUD           | 20/60s  |

### 4. Input validation

- **Zod** — Request bodies validated with schemas in `lib/schemas/`.
- **Address** — Pincode 6 digits, phone 10 digits, Indian pincode format.
- **Order** — UUIDs, positive quantities, valid prices.
- **Product** — Sub-brand, category enums, variant constraints.

### 5. File uploads

- **Admin-only** — Product and craft uploads require admin.
- **Validation** — MIME type, max 5MB, magic-byte checks (JPEG, PNG, GIF, WebP).
- **Unique filenames** — Timestamp + random string to avoid overwrites.

### 6. Payment security

- Razorpay order creation and verification.
- Webhook secret for signature verification (when configured).
- Order totals computed server-side; client never trusted for amounts.

---

## Technology Stack

| Category        | Technology                          |
|-----------------|-------------------------------------|
| Framework       | Next.js 14 (App Router)             |
| Language        | TypeScript                          |
| Database        | Supabase (PostgreSQL)               |
| Auth            | Supabase Auth (Google OAuth)        |
| Storage         | Supabase Storage                    |
| Payments        | Razorpay                            |
| Styling         | Tailwind CSS                        |
| Animations      | Framer Motion                       |
| Validation      | Zod                                 |
| Unit tests      | Vitest + Testing Library            |
| E2E tests       | Playwright                          |

---

## Testing

### Unit tests (Vitest)

```bash
npm run test
```

Tests live in `lib/utils/__tests__/`:

- `extract-api-error.test.ts` — Error extraction from API responses
- `price.test.ts` — Price formatting
- `slug.test.ts` — Slug generation

### E2E tests (Playwright)

```bash
# Install browsers (first time)
npm run test:e2e:install

# Run E2E (starts dev server automatically)
npm run test:e2e
```

E2E coverage:

- **home.spec.ts** — Homepage loads, header, main content
- **auth.spec.ts** — Login page, protected redirects
- **cart.spec.ts** — Cart page, empty state, shop link
- **checkout.spec.ts** — Checkout auth redirect, checkout button
- **shop.spec.ts** — Shop page, product grid or empty state

E2E runs against `http://localhost:3001` (see `playwright.config.ts`).

---

## Project Structure

```
ecommerce/
├── app/                    # Next.js App Router
│   ├── about/              # About pages
│   ├── account/            # User account
│   ├── admin/              # Admin panel
│   ├── api/                # API routes
│   ├── auth/               # Auth callback
│   ├── cart/               # Cart page
│   ├── checkout/           # Checkout
│   ├── login/              # Login
│   ├── orders/             # Orders
│   ├── shop/               # Shop & product detail
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── account/            # OrderItem, LogoutButton
│   ├── admin/              # AdminNav
│   ├── landing/            # Hero, Footer, FeaturedProducts, etc.
│   ├── shop/               # ProductCard, ProductDetailClient, etc.
│   └── ui/                 # Skeleton, ImagePlaceholder
├── contexts/               # CartContext, ToastContext
├── lib/
│   ├── schemas/            # Zod schemas (address, order, product)
│   ├── supabase/           # Client, server, middleware
│   ├── hooks/              # useCraftImages
│   ├── utils/              # price, slug, validation, extract-api-error
│   ├── api-errors.ts       # API error helpers
│   ├── auth.ts             # getCurrentUser, requireAdmin
│   ├── constants.ts
│   ├── logger.ts
│   └── rate-limit.ts
├── types/                  # database.ts, product.ts
├── e2e/                    # Playwright specs
├── scripts/                # seed-admin.ts
└── supabase/
    └── migrations/         # SQL migrations (run in order)
```

---

## Database Migrations

Run migrations in **Supabase SQL Editor** in this order:

| File                                      | Purpose                                              |
|-------------------------------------------|------------------------------------------------------|
| `001_initial_schema.sql`                   | Users, products, addresses, orders, order_items, reviews, RLS, auth trigger |
| `002_products_variants_schema.sql`        | Product variants, order_items.variant_id             |
| `003_fix_rls_policies.sql`                | Add WITH CHECK for INSERT on products, orders, addresses |
| `004_storage_rls_policies.sql`           | Storage policies for `products` bucket               |
| `005_cart_table.sql`                      | cart_items table                                     |
| `006_order_items_insert_policy.sql`       | Users can insert order items for own orders          |
| `007_stock_management_function.sql`      | decrement_variant_stock()                            |
| `008_featured_products.sql`               | is_featured, featured_order                         |
| `009_order_status_enums.sql`              | order_status (placed/shipped/delivered), status constraint |
| `010_craft_storage_policies.sql`          | Storage policies for `craft` bucket                  |
| `011_reviews_product_ids_reviewer_name.sql` | product_ids, reviewer_name, one review per order   |

---

## Environment Variables

| Variable                    | Required | Description                                  |
|----------------------------|----------|----------------------------------------------|
| `SUPABASE_URL`             | Yes      | Supabase project URL                         |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes      | Same as above (client-side)                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key                            |
| `SUPABASE_SERVICE_ROLE_KEY`| Yes      | Service role key (server-only, keep secret)  |
| `ADMIN_EMAILS`             | No       | Comma-separated admin emails for seed script |
| `NEXT_PUBLIC_SITE_URL`     | No       | Site URL for SEO (product structured data)   |
| `RAZORPAY_KEY_ID`          | No       | Razorpay key ID (payments)                   |
| `RAZORPAY_KEY_SECRET`      | No       | Razorpay secret (payments)                   |
| `RAZORPAY_WEBHOOK_SECRET`  | No       | Webhook secret (payments)                    |

---

## Clone and set up this project

Use this when you’ve cloned or pulled the repo and want to run it locally.

1. **Clone (or pull)**
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
   cd YOUR_REPO
   ```
   If the repo already exists: `git pull` to get latest changes.

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and add your Supabase URL, anon key, and service role key (see [Environment Variables](#environment-variables)).

4. **Database**
   In Supabase **SQL Editor**, run the migrations in `supabase/migrations/` in order (001 through 011). Create the `products` and `craft` storage buckets (see [Setup → Storage buckets](#4-storage-buckets)).

5. **Auth**
   In Supabase, enable Google (or your provider) under **Authentication → Providers**. Add the redirect URL for your app.

6. **Run**
   ```bash
   npm run dev
   ```
   Open **http://localhost:3001**. Sign in once, then run `npx tsx scripts/seed-admin.ts` to make your user an admin (set `ADMIN_EMAILS` in `.env.local` first).
