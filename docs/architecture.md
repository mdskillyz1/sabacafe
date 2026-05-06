# Saba Cafe Architecture

## Apps

- `apps/web`: Next.js website, customer ordering flow, API routes, and admin dashboard.
- `apps/mobile`: React Native / Expo app consuming the same menu, order, and checkout APIs.
- `packages/shared`: shared menu seed data, domain types, pricing, postcode validation, and formatting helpers.
- `packages/database`: Prisma schema, Prisma client wrapper, and seed script.

## Core Flow Implemented

1. Customer browses menu cards from shared data.
2. Customer adds dishes to cart with notes.
3. Customer chooses pickup or delivery.
4. Checkout validates minimum order, contact details, and local delivery postcode.
5. API creates an order with separate order status and payment status.
6. Checkout API creates a Stripe PaymentIntent when `STRIPE_SECRET_KEY` exists.
7. Without Stripe keys, demo mode marks the order paid so the product can be tested locally.
8. Admin dashboard reads live orders and updates operational status.

## Production Hardening Next

- Replace in-memory demo order store with Prisma reads/writes in `apps/web/src/lib/data.ts`.
- Add NextAuth/Auth.js or Clerk/Supabase auth with role checks for admin routes.
- Add Stripe Elements client confirmation using `clientSecret`.
- Add Google Places API review cache job and admin moderation screens.
- Add email/SMS/push notification providers.
- Add analytics events to a real destination such as GA4, Meta CAPI, or Segment.
