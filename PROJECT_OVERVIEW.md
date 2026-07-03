# AfricaMart Android — Project Overview

Complete technical reference for this repo: what it is, how it's built, how
data flows, and how to build/ship it. For a quick-start, see [README.md](README.md).
For what's implemented vs. what's next, see [FEATURES_AND_ROADMAP.md](FEATURES_AND_ROADMAP.md).

## 1. What this app is

A native Android (and iOS-capable) client for the AfricaMart B2B marketplace,
built with React Native + Expo. It talks directly to the same Supabase backend
(Postgres + Auth + Storage) and Cloudflare Functions that the web app
(`apps/marketplace` in the main AfricaMart repo) uses — both clients read and
write the same live data, there is no separate mobile backend.

### History

- **v1 (commit `6e806d5`)**: scaffolded as a Capacitor wrapper — a native
  shell around the existing web app running in a WebView.
- **v2 (commit `cefcc05`, current)**: rebuilt from scratch as a pure React
  Native/Expo client with native screens, not a WebView wrapper. The
  motivating issue was Google OAuth: Google rejects sign-in attempts made
  from an embedded WebView ("disallowed_useragent"), which broke Google
  sign-in in the Capacitor version. The RN rebuild opens Google auth in the
  system browser instead, which Google allows.

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | Expo SDK ~54 (managed workflow), React Native 0.81.5, React 19.1 |
| Language | TypeScript |
| Navigation | React Navigation (native-stack + bottom-tabs) |
| State | Zustand (two stores: auth session, cached bootstrap data) |
| Backend | Supabase (Postgres, Auth, Storage, RPCs) via `@supabase/supabase-js` |
| Backend (writes needing server-side validation) | Cloudflare Functions at `https://africamart.co/api/*` |
| Bot protection | Cloudflare Turnstile, rendered via a hidden WebView bridge (no native SDK exists) |
| Local persistence | `expo-secure-store` + `@react-native-async-storage/async-storage` (session), AES-256 via `aes-js` |
| Build/deploy | EAS Build (`eas.json`) |

> **Note (as of 2026-07-03)**: `package.json` currently pins `expo: ^54.0.35`.
> `AGENTS.md` in this repo says "Expo HAS CHANGED" and points at the v56
> docs — if you're about to touch Expo config/plugins, confirm which SDK
> version is actually intended before trusting cached knowledge; check
> `npx expo --version` / `app.json`/`package.json` against
> https://docs.expo.dev/versions/v56.0.0/ if a v56 upgrade is in flight.

## 3. Project structure

```
src/
  config/env.ts        Supabase URL/anon key, Turnstile site key, API_BASE_URL
  lib/
    supabaseClient.ts   Supabase client instance (uses LargeSecureStore for session persistence)
    largeSecureStore.ts AES-256-encrypted session storage (see §5)
  store/
    useAuthStore.ts     Session, profile (buyer/supplier), active role
    useAppDataStore.ts  Cached bootstrap data: countries, currencies, categories
  services/             One module per backend domain — thin wrappers around
                         Supabase queries/RPCs and Cloudflare Function calls.
                         Mirrors the web app's service layer 1:1.
    auth.service.ts       sign in/up/out, Google OAuth, profile provisioning
    catalog.service.ts    product/supplier search, product detail, inquiries
    buyer.service.ts      buyer RFQs/orders/saved items/settings
    supplier.service.ts   supplier products, media upload, inquiries, KYC, analytics, settings
    rfq.service.ts        RFQ submit/list/detail, quotes, accept-quote → order
    storefront.service.ts public supplier storefront (products, reviews, view tracking)
    bootstrap.service.ts  countries, currencies, categories, public stats
    mappers.ts            DB row → app-shape type mappers shared across services
  navigation/
    RootNavigator.tsx    Chooses AuthStack vs MainTabs based on session state
    AuthStack.tsx        Login, sign up, forgot password
    MainTabs.tsx         Bottom tabs: Home, Browse, RFQs, Dashboard, Account
    HomeStack.tsx / BrowseStack.tsx / RFQStack.tsx / DashboardStack.tsx
                         Per-tab native-stack navigators
  screens/
    auth/                Login, sign up, forgot password
    marketplace/          Home, Browse, Product detail, Storefront, Inquiry
    rfq/                  RFQ list, detail, submit
    buyer/                My RFQs, My Orders, Saved items, Settings
    supplier/              Products (list/edit), Inquiries (list/thread),
                           Verification, Store settings, Analytics, Matched RFQs, Submit quote
    DashboardScreen.tsx   Role-aware menu (buyer menu vs supplier menu + role switcher)
    AccountScreen.tsx     Profile summary + sign out
  components/            TurnstileWidget, ProductCard, SupplierCard, BarChart
  theme.ts               Color tokens (`colors.*`)
  types/aes-js.d.ts       Hand-written types for aes-js (untyped package)
```

## 4. Navigation architecture

`RootNavigator` renders `AuthStack` while `session` is null and `MainTabs`
once a session exists (`src/navigation/RootNavigator.tsx:24`). `MainTabs` is
a bottom-tab navigator with 5 tabs, each wrapping its own native-stack:

- **HomeTab** → `HomeStack` (marketplace home)
- **BrowseTab** → `BrowseStack` (search/browse products & suppliers)
- **RFQs** → `RFQStack` (RFQ list/detail/submit)
- **Dashboard** → `DashboardStack` — the largest stack; it hosts the
  role-aware `DashboardScreen` menu plus every buyer and supplier screen
  (product detail, storefront, inquiry thread, KYC upload, analytics, etc.)
  so that navigating from the dashboard into e.g. a product or storefront
  stays within the Dashboard tab's stack.
- **Account** → `AccountScreen` (no sub-stack)

There is no separate buyer/supplier tab set — the same 5 tabs are shown to
everyone, and `DashboardScreen` swaps its menu (and the screens reachable
from it) based on `authState.role`.

## 5. Auth flow

**Store**: `useAuthStore` (`src/store/useAuthStore.ts`) holds `session`,
`authState` (derived: name/role/company/initials), `buyerProfile` /
`supplierProfile` (existence + active/deactivated flags), and `activeRole`
for users who have both a buyer and a supplier account.

**Flow**:
1. `RootNavigator` calls `init()` on mount → fetches the current Supabase
   session, then subscribes to `supabase.auth.onAuthStateChange`.
2. On any session change, `applySession()`:
   - Rebuilds `authState` from `user.user_metadata` (name, role, company).
   - Idempotently ensures a `buyers` or `suppliers` row exists for this
     account (`ensureBuyerRecord` / `ensureSupplierRecord`) — mirrors the web
     app's post-sign-in provisioning. Non-fatal if it fails (e.g. row already
     exists, or email confirmation is still pending).
   - Loads both profile refs so the dashboard can offer a role switcher if
     the account has both.

**Email/password & sign-up**: both go through
`supabase.auth.signInWithPassword` / `signUp`, gated by a Cloudflare
Turnstile token from `TurnstileWidget` (a hidden WebView bridge — Turnstile
has no native SDK). The Supabase Auth API itself enforces the captcha
server-side.

**Google OAuth**: `signInWithGoogle()` (`src/services/auth.service.ts:74`)
opens the OAuth consent screen in the **system browser**
(`expo-web-browser`'s `openAuthSessionAsync`), not an in-app WebView — this
is the fix for the Capacitor-era "disallowed_useragent" block. Flow is PKCE:
Supabase redirects to `co.africamart.app://auth-callback` with a `code` query
param, which the app exchanges for a session via `exchangeCodeForSession`.

**Session persistence**: `LargeSecureStore`
(`src/lib/largeSecureStore.ts`) — `expo-secure-store` caps values at ~2KB on
Android, too small for a Supabase session (access + refresh JWT). Workaround:
a random AES-256 key is generated once and stored in SecureStore; the actual
session blob is AES-CTR encrypted with that key and stored in AsyncStorage
(no size cap). This is the standard pattern from Supabase's own Expo guide.

**Required manual Supabase dashboard setup** (see README.md for details):
Google provider must be enabled, and
`co.africamart.app://auth-callback` must be added as an allowed redirect URL
— both currently pending on the live project as of the last README update.

## 6. Data layer

Every domain has a `*.service.ts` module that is a thin, typed wrapper
around either:
- Direct Supabase table queries/RPCs (`supabase.from(...)`, `supabase.rpc(...)`) — used for reads and simple writes, relying on Postgres RLS for authorization.
- Cloudflare Function calls (`fetch(`${API_BASE_URL}/api/...`)`) — used where server-side validation/side-effects are needed (`inquiry-submit`, `rfq-submit`), same endpoints the web app posts to.

`mappers.ts` centralizes DB-row → app-type conversion (`Product`, `Supplier`,
`RFQ`, `Quote`, `Order`, `Review`, `Category`, `Country`, `Currency`) so
screens never touch raw snake_case Postgres rows.

**File/image uploads** (`supplier.service.ts`): assets picked via
`expo-image-picker` / `expo-document-picker` are read as a `Blob` via
`fetch(uri).then(r => r.blob())`, then uploaded to Supabase Storage buckets
(`supplier-media`, `product-images`, `kyc-docs`), with the resulting public
(or signed, for KYC) URL written back onto the owning row.

**Bootstrap data** (`useAppDataStore`): countries, currencies, and categories
are fetched once per app session and cached in memory (`loaded` guard) —
used to populate pickers/filters across screens without re-fetching.

## 7. Configuration

`src/config/env.ts` reads the Supabase URL, Supabase anon key, Turnstile site
key, and `API_BASE_URL` from `EXPO_PUBLIC_*` environment variables, falling
back to the current production values as literals if none are set. These are
the same public/client-safe values the web app uses (`core/config.js` in the
main repo) — the anon key and Turnstile site key are both meant to be
client-exposed, so there's nothing sensitive here either way.

**Env var mechanism**: Expo's Metro config auto-loads `.env`, `.env.local`,
`.env.$(NODE_ENV)`, `.env.$(NODE_ENV).local` at build/start time and inlines
any `EXPO_PUBLIC_*`-prefixed variable into the bundle — no extra package or
babel/metro config needed (confirmed against Expo's current
environment-variables guide before implementing this). Per Expo's own
guidance, this project does **not** key `.env` selection off `NODE_ENV`
(`expo export` always forces `NODE_ENV=production`, which would silently
defeat a `NODE_ENV`-based switch) — instead:

- `.env` (committed) holds the production defaults — identical to the
  values that were previously hardcoded, so default behavior is unchanged.
- `.env.example` documents the four keys.
- `.env.local` (already gitignored via the existing `.env*.local` rule) is
  where a developer would put different values to point a local build at a
  different backend (e.g. a staging Supabase project), without touching the
  committed `.env`.

**Note**: this only builds the *mechanism* — there is still only one real
backend (production). Standing up an actual staging Supabase project is a
manual/business decision outside this repo's code.

## 8. Build & deployment (EAS)

`eas.json`:
- **preview** profile: internal distribution, builds an Android **APK**
  (for direct install/sideload testing).
- **production** profile: builds an Android **app bundle (AAB)** (for Play
  Store submission).

`app.json` (`expo` key):
- Package ID: `co.africamart.app` (both Android package and iOS bundle ID)
- Deep link scheme: `co.africamart.app://`
- `versionCode: 1` (Android build number — bump per Play Store submission)
- EAS project ID: `75024675-5af8-456d-af6f-5fd75274b11a`, owner: `mohit8901`
- Android permission: `RECORD_AUDIO` (declared but not yet wired to a
  feature — see roadmap doc)
- Plugins: `expo-image-picker` (photo library access, for product images/branding),
  `expo-document-picker` (KYC doc uploads), `@react-native-community/datetimepicker`

To build: `eas build --profile preview --platform android` (APK) or
`eas build --profile production --platform android` (AAB for store).

## 9. Local development

```
npm install
npx expo start
```

Scan the QR with Expo Go on Android, or press `a` for an emulator. A
committed `.env` ships default (production) values, so no setup is required
to get running — see §7 to point at a different backend locally.

## 10. Testing & CI

- **Tests**: `npm test` runs Jest (`jest-expo` preset, pinned to
  `jest-expo@54.0.17` to match the installed Expo SDK 54 — the latest
  `jest-expo` targets SDK 57 and will not resolve against this project's
  React/React Native versions). Coverage is deliberately scoped to:
  - `src/services/__tests__/mappers.test.ts` — thorough coverage of every
    pure mapper function (`mapProduct`, `mapSupplier`, `mapOrder`, `mapReview`,
    `mapRFQ`, `mapQuote`, `mapCountry`/`mapCurrency`/`mapCategory`, `timeAgo`,
    `formatDeadline`, `formatMonthYear`) — no mocking needed.
  - `src/services/__tests__/auth.service.test.ts` — `buildAuthState`, which
    indirectly exercises the unexported `initials()` helper through its output.
  - `src/services/__tests__/catalog.service.test.ts` and
    `.../storefront.service.test.ts` — one function each (`searchProducts`,
    `submitReview`) demonstrating the pattern for testing a function that
    calls the real Supabase client: `jest.mock("../../lib/supabaseClient")`
    with a fake `rpc`/chainable query-builder stub. Copy this pattern for
    future service tests rather than mocking the whole Supabase SDK.
  - The other services (thin CRUD/upload wrappers) aren't covered — testing
    them meaningfully would mean re-implementing a fake Postgres/Storage
    behind the mock, for little payoff over what the pattern above already proves.

- **CI**: `.github/workflows/ci.yml` runs on push/PR to `main` —
  `npm ci` → `npx tsc --noEmit` → `npm test`. Deliberately does not run a
  linter: there's no existing ESLint config in this repo, and standing one
  up (rule set, plugins) is a separate decision left for later.
