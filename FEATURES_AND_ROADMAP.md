# AfricaMart Android — Features & Roadmap

What's actually implemented in this repo right now, and what's reasonable to
build next. For architecture/how-it-works, see
[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md).

_Last reviewed against the working tree: 2026-07-03 (engineering-health pass applied)._

## 1. Implemented features

### Auth (all users)
- Email/password sign in and sign up, Turnstile-protected (`LoginScreen`, `SignUpScreen`)
- Google OAuth via system browser (works around Google's WebView block)
- Forgot-password flow (`ForgotPasswordScreen`)
- Session persistence across app restarts (AES-encrypted, survives app kill)
- Role-aware account provisioning — a `buyers` and/or `suppliers` row is
  auto-created on first sign-in based on the account's role
- Support for accounts with **both** a buyer and supplier profile, with an
  in-app role switcher on the Dashboard
- Sign out (`AccountScreen`)

### Marketplace (buyer-facing, browsing)
- Home screen with public stats (product/buyer counts)
- Product & supplier search/browse with filters: text query, category,
  country, verified-only, max price, max MOQ, sort (inquired/rating/views),
  pagination (`BrowseScreen`, `catalog.service.searchProducts` / `browseSuppliers`)
- Product detail screen — specs, price tiers, certs, attachments, origin
  country, view-count tracking
- Supplier storefront screen — public profile, products list, reviews,
  profile-view tracking
- Send inquiry / request sample to a supplier, from a product or storefront
  (`InquiryScreen` → Cloudflare `inquiry-submit` endpoint, Turnstile-gated)

### RFQs (Request for Quote) — buyer side
- Submit an RFQ (title, category, quantity, destination country, deadline,
  description) via Cloudflare `rfq-submit` endpoint
- List all open RFQs (`RFQListScreen`)
- RFQ detail screen with quotes received
- Accept a quote → marks quote accepted, declines the rest, marks the RFQ
  awarded, and **creates an order** automatically (`acceptQuote` in `rfq.service.ts`)

### Buyer dashboard
- My RFQs (submitted, with status)
- My Orders (with supplier name/slug)
- Saved items — save/unsave both products and suppliers, view saved lists
- Buyer settings — name, phone, country, delivery country, email
  notifications toggle

### Supplier dashboard
- Product management: create/edit/deactivate products (price, MOQ, unit,
  tags, price tiers, specs, certs, origin country)
- Product photo + multi-file attachment upload (images and PDFs) to Supabase
  Storage
- Inquiries inbox — list + per-inquiry message thread (two-way messaging,
  buyer ↔ supplier)
- KYC / verification — upload verification docs, view submission status and
  reviewer notes
- Store settings — bio, certs, capabilities, brand color, tags, "since"
  year, website, business hours, plus logo/banner/about-image upload
- Analytics — profile views, product views, total inquiries, response rate,
  conversion rate, 7-day deltas, 30-day trend chart (`BarChart` component)
- Matched RFQs — RFQs scored/matched to this supplier (`rfq_matches` table),
  with a submit-quote flow (price, lead time, payment terms, incoterm, certs)
- General account settings (name, type, phone, country, default currency, slug)

### Build/infra
- EAS build profiles for internal APK (preview) and Play Store AAB (production)
- Android adaptive icon, deep link scheme, Play Store package identity configured
- Order detail screen (`OrderDetailScreen`) — value/status/date/supplier
  drill-down from My Orders, with a "Leave a review" entry point
- Review submission (`ReviewSubmitScreen`, `storefront.service.submitReview`) —
  star rating + text, reachable from an order's detail screen
- `EXPO_PUBLIC_*` env var support in `src/config/env.ts` (`.env`/`.env.example`),
  so a local build can point at a different backend without code changes
- Jest test suite (`jest-expo`) covering the mapper layer, `buildAuthState`,
  and a mocked-Supabase-client pattern for service functions
- GitHub Actions CI (`.github/workflows/ci.yml`) — typecheck + test on push/PR to `main`

## 2. Explicitly out of scope for this app (per README)

- **Admin console** — remains web-only.
- **"Ultra" storefront theme/section editor** — remains web-only.
- **Service-offerings editor** (for service-type suppliers, as opposed to
  product suppliers) — remains web-only.

## 3. Known gaps / rough edges worth knowing about

- `RECORD_AUDIO` Android permission is declared in `app.json` but nothing in
  `src/` currently uses microphone access — either a feature is planned and
  unbuilt, or this permission should be removed before a Play Store
  submission (unused dangerous permissions draw review scrutiny).
- Google OAuth requires manual one-time setup on the Supabase dashboard
  (enable Google provider, add the mobile redirect URL) that may not be done
  yet on the live project — confirm before relying on Google sign-in in testing.
- Test coverage is intentionally partial (mappers + `buildAuthState` + one
  service function per mocking pattern) — no coverage yet for screens,
  navigation, or the bulk of the CRUD/upload service functions.
- CI runs typecheck + test only — no linter is configured in the repo, so CI
  doesn't catch style/lint issues.
- The env-var split (`EXPO_PUBLIC_*` in `.env`) only builds the *mechanism*
  for a dev/staging override — there is still only one real backend
  (production); a genuine staging Supabase project hasn't been created.

## 4. Suggested next steps

Ordered roughly by what would most affect a real launch; not a commitment,
just a sensible backlog to pick from.

**Before a Play Store release**
1. Resolve the `RECORD_AUDIO` permission question (build the feature or drop it).
2. Confirm/complete the Supabase Google-auth manual setup, and test the
   full Google sign-in round trip on a real device.
3. Add app store listing assets (screenshots, feature graphic, privacy
   policy link) and fill in Play Console data-safety form (the app touches
   photos, documents, and account data).
4. Decide on and pin an Expo SDK version deliberately (see the SDK-version
   note in `PROJECT_OVERVIEW.md` §2) rather than leaving it ambiguous
   between `package.json`'s `^54` and `AGENTS.md`'s "v56" pointer.

**Product gaps vs. the web app**
5. Push notifications for new inquiries, quotes, and RFQ matches — high
   value for a mobile-first supplier workflow, currently nothing polls or
   pushes; inquiry/RFQ threads only update on manual refresh. Needs a
   Firebase/FCM project — out of scope until that account exists.
6. Real-time updates for inquiry message threads (Supabase Realtime
   subscriptions instead of pull-to-refresh).
7. Payments/checkout flow for orders, if the web app has one this client
   should mirror. Needs a payment gateway account — out of scope until then.

**Engineering health follow-ups**
8. Stand up a real staging Supabase project and populate `.env.staging`-style
   values, now that the env-var override mechanism exists (§1, §3).
9. Add ESLint (rule set/plugin choice is a separate decision) and wire it
   into the new CI workflow.
10. Expand test coverage to the remaining service functions and, if a
    device/emulator testing story is set up, the new screens.
