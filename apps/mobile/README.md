# Saba Cafe Mobile App - Future Phase

The mobile app idea is paused for the current delivery.

Current priority is the working web platform:
- Customer-facing website
- Admin dashboard
- Shared backend/database
- Menu management
- Orders and payments
- Pickup/delivery
- Table bookings
- Reviews

This folder is intentionally not part of the active pnpm workspace right now, so Expo / React Native dependencies cannot break the website build.

TODO for the later mobile phase:
- Re-add `apps/mobile` to `pnpm-workspace.yaml`.
- Re-enable a root `dev:mobile` script.
- Point the app at the production web API.
- Share the same auth, menu, cart, order, booking, review, and loyalty APIs.
