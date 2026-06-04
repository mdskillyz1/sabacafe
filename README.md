# Saba Cafe Platform

A premium web platform for **Saba Cafe**, a warm modern Somali cafe at **152 Old Kent Rd, London SE1 5TY**. It includes a responsive Next.js website, shared backend/API routes, Prisma data model, Stripe-ready checkout, bookings, reviews and Google review settings, loyalty/referral-ready models, and a protected admin dashboard.

Mobile app planned for later phase and is not required for current web build.

## Project Structure

```txt
apps/
  web/                  Next.js website, API routes, checkout, admin dashboard
  mobile/               Future phase only; intentionally outside active workspace
packages/
  shared/               Shared types, seed menu, pricing, validation helpers
  database/             Prisma schema, Prisma client, seed script
docs/
  architecture.md       Implementation notes and production hardening path
```

## Current Web Platform Scope

- Website homepage with food-first hero, CTAs, featured dishes, reviews, hours, trust badges, booking, gallery, and web platform highlights.
- Full menu and online ordering flow: `Menu → cart → dine-in QR / collection / delivery → payment → confirmation`.
- Delivery postcode validation, minimum order value, promo code, delivery fee, VAT breakdown, and clear total.
- Stripe Checkout and PaymentIntent routes. Online card payments require Stripe keys; offline pay-in-store/cash methods can be enabled from admin.
- Stripe webhook route for payment success/failure.
- Admin order dashboard and kitchen view with filters for dine-in, collection, delivery, payment state, and status updates.
- Table booking flow with customer guest-size selection, admin-controlled availability, pending approvals, table management, blocked dates, blocked slots, and special hours.
- Dynamic footer/business info system with admin-managed business name, copyright, address, email, phone, opening hours text, and social links.
- Production-ready legal pages and footer compliance links for terms, privacy, cookies, refunds, delivery, accessibility, and contact.
- Admin Overview is a real-data BI dashboard for sales, orders, bookings, website events, top sellers, and staff activity. It shows zero/empty states when no real activity exists.
- Mobile app has been moved to a future phase and is excluded from the active pnpm workspace so Expo / React Native cannot break the website build.
- Prisma schema covering users, profiles, addresses, menu, carts, orders, payments, reviews, Google review cache, promos, loyalty, bookings, opening hours, delivery zones, admin users, and settings.

## Restaurant Listing

- Address: `152 Old Kent Rd, London SE1 5TY`
- Phone: `020 8050 9600`
- Category: `Cafe`
- Google rating: `5.0` from `3` Google reviews
- Google review link: `https://g.page/r/CaphpFnncQ9OEAE/review`
- Hours label: `Open today until 10 pm`

## Setup

```bash
./tools/pnpm install
cp .env.example .env
PATH="$PWD/tools:$PATH" ./tools/pnpm db:generate
PATH="$PWD/tools:$PATH" ./tools/pnpm db:push
PATH="$PWD/tools:$PATH" ./tools/pnpm db:seed
PATH="$PWD/tools:$PATH" ./tools/pnpm dev:web
```

The web app runs at [http://localhost:3000](http://localhost:3000).

The temporary static client preview can also be served from `static-preview/` while local Next.js runtime issues are being resolved:

```bash
python3 -m http.server 3000 --bind 127.0.0.1 --directory static-preview
```

## Environment Variables

```txt
DATABASE_URL                 PostgreSQL connection string
NEXT_PUBLIC_SITE_URL          Public web URL, for example https://sabacafe-web.vercel.app
GOOGLE_PLACE_ID               Google Place ID for Saba Cafe
GOOGLE_REVIEW_URL             Google Business Profile review URL
GOOGLE_PLACES_API_KEY         Google Places API key for approved review fetches
STRIPE_SECRET_KEY             Stripe secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET         Stripe webhook signing secret
VAT_RATE                      Default 0.20
MINIMUM_ORDER_PENCE           Default 1200
```

For Vercel, `NEXT_PUBLIC_SITE_URL` is recommended for correct social preview URLs, but the app also falls back to Vercel's `VERCEL_URL` so the homepage can render without it. Stripe and Google variables are optional for the temporary preview path. Missing Stripe values disable online card payment startup; orders are only marked paid after a confirmed Stripe webhook.

Menu management requires `DATABASE_URL` for real saving. If it is missing, the admin menu page shows a setup message and save/publish buttons are disabled. Run `PATH="$PWD/tools:$PATH" ./tools/pnpm db:push` after adding the database URL so the `MenuItem.published` column exists before staff publish dishes. Local JSON fallbacks are only for read-only development previews and are not used as a production menu-saving workaround.

Admin menu images are uploaded through `/api/admin/menu/upload`, validated as JPG/PNG/WebP up to 5MB, resized in the browser where possible, and stored with the menu item as a data URL. This avoids Vercel filesystem storage. For a larger production catalogue, replace that endpoint with Vercel Blob, Cloudinary, or Supabase Storage while keeping the saved `image` URL field.

Admin login:

Development admin account:

```txt
Username: admin
Password: admin123
```

Change this before production by logging into `/admin/users`, creating a new Super Admin, then disabling or deleting the development account.

Admin authentication uses usernames, secure password hashes, signed HTTP-only session cookies, and basic login rate limiting. Super Admins can manage admin users from `/admin/users`.

Admin session variable:

```txt
ADMIN_SESSION_TOKEN           Long random cookie secret for signed admin sessions
```

## Stripe Setup

1. Add `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
2. Create a webhook endpoint pointing to `/api/stripe/webhook`.
3. Subscribe to `payment_intent.succeeded` and `payment_intent.payment_failed`.
4. Add `STRIPE_WEBHOOK_SECRET`.

Current behaviour: when Stripe keys are missing, online card payment startup returns a setup error. Pay-in-store and cash options can still be enabled from admin. Orders are only marked `PAID` after Stripe confirms payment through the webhook.

## QR Dine-In Ordering

Saba Cafe supports three order types from the same menu and admin system:

- Dine-in QR table ordering: `/order?type=dine-in&table=12`
- Takeaway collection
- Delivery

Staff can manage booking/restaurant tables from `/admin/bookings`. Each active table has a QR download link that points customers to the ordering page with the table number pre-filled. Orders appear in `/admin/orders` and `/admin/kitchen` with the order type and table number clearly shown.

## Google Reviews Setup

1. Add `GOOGLE_PLACE_ID`.
2. Add `GOOGLE_REVIEW_URL` for the "Leave us a Google Review" button.
3. Add `GOOGLE_PLACES_API_KEY` for approved Google Places review fetching.
4. Store fetched reviews in `GoogleReviewCache` and render cached data to keep pages fast.

Never create fake reviews. Demo placeholders in this project are labelled as placeholders.

## Deployment Notes

- Deploy the temporary website demo to Netlify using the included `netlify.toml`.
- Netlify build command: `pnpm --filter @saba/web build`
- Netlify publish directory: `apps/web/.next`
- Netlify should use Node `20` and pnpm from `packageManager`.
- For a temporary client link, set `NEXT_PUBLIC_SITE_URL` to the final Netlify URL after the first deploy, for example `https://your-site-name.netlify.app`.
- Use managed PostgreSQL such as Neon, Supabase, RDS, or Railway.
- Run Prisma migrations during release.
- Configure Stripe and Google secrets in the deployment environment.
- Mobile app is not part of this deployment phase.

### Temporary Netlify Demo

1. Push this repository to GitHub.
2. In Netlify, choose **Add new site → Import an existing project**.
3. Select the repository.
4. Use these build settings:
   - Base directory: leave empty
   - Build command: `pnpm --filter @saba/web build`
   - Publish directory: `apps/web/.next`
5. Add environment variables:
   - `ADMIN_SESSION_TOKEN`: a long random secret for admin sessions
   - `NEXT_PUBLIC_SITE_URL`: the Netlify URL
   - `GOOGLE_REVIEW_URL`: Saba Cafe Google review URL
   - `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL`: Saba Cafe Google map embed URL
6. Deploy.

Note: this is suitable for a temporary client preview. Production menu persistence requires `DATABASE_URL` and the Prisma schema pushed to the database; local JSON fallbacks are only for development previews.

## Admin Roadmap

The admin dashboard is web-first and organized around:
- Overview
- Menu
- Orders
- Bookings
- Reviews
- Opening hours
- Delivery settings
- Promo codes
- Customers
- Website settings

The data model already supports menu editing, categories, images, allergens, add-ons, availability, reviews, Google review settings, opening hours, delivery radius, delivery fees, VAT, promo codes, featured dishes, homepage banners via settings, loyalty rewards, bookings, customers, and sales views.

Website settings currently stores editable footer/business information in `apps/web/data/business-info.json` for local demos, with API routes at `/api/business-info` and `/api/admin/business-info`. The Prisma `AppSettings` model also includes matching fields for the production database path.

Analytics uses real activity only. Website events are tracked through `/api/website-events`; admin activity is logged for logins, settings/menu updates, and order/booking status changes. Local demos store these in `apps/web/data/website-events.json` and `apps/web/data/admin-activity.json`; the Prisma schema includes matching `WebsiteEvent` and `AdminActivityLog` models for production persistence.

Legal content is managed from `/admin/website-settings` and stored locally in `apps/web/data/legal-content.json` for demos. The Prisma schema includes `LegalPage` and `CookieConsent` models for production persistence. The cookie banner stores visitor preferences in browser storage and is ready for future analytics integrations.

## Future Mobile Phase

The mobile app concept is intentionally paused. The `apps/mobile` folder remains as future reference only and is not included in `pnpm-workspace.yaml`.

When the web platform is stable, the future mobile phase can:
- Re-add `apps/mobile` to `pnpm-workspace.yaml`.
- Restore a root `dev:mobile` script.
- Connect Expo to the same production APIs for menu, cart, orders, bookings, reviews, loyalty, and accounts.
- Reuse shared types from `@saba/shared`.
