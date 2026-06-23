# AfricaMart — Android app (React Native / Expo)

A native Android app for the AfricaMart marketplace — not a WebView wrapper.
It talks directly to the same Supabase backend (Postgres + Auth + Storage)
and Cloudflare Functions that the web app (`apps/marketplace` in the main
AfricaMart repo) uses, so both apps share live data.

## Scope

This first version covers the buyer marketplace and the supplier portal:

- **Buyer**: browse/search products & suppliers, product detail, storefronts,
  send inquiries, post RFQs, view/accept quotes, buyer dashboard (RFQs,
  orders, saved items, settings).
- **Supplier**: manage products (with photo upload), inquiries inbox + chat,
  KYC verification document upload, store settings, analytics.
- **Not included yet**: the admin console, and the "Ultra" storefront
  theme/section editor and service-offerings editor (service-type suppliers)
  — those remain web-only for now.

## Prerequisites

- Node.js and npm
- [Expo Go](https://expo.dev/go) on an Android device, or an Android Studio
  emulator, for local testing
- An [EAS](https://expo.dev/eas) account if/when building a signed APK

## Setup

```
npm install
```

Supabase URL/anon key and the Cloudflare Turnstile site key are in
`src/config/env.ts` — same public/client-safe values the web app uses
(`core/config.js` in the main repo). No secrets are stored client-side.

## Run

```
npx expo start
```

Scan the QR code with Expo Go (Android), or press `a` to launch an Android
emulator.

## Required manual setup (Supabase dashboard)

- **Authentication → Providers → Google**: enable it. It's currently
  disabled on the live project — Google sign-in won't work until this is
  turned on (this is independent of this app; the web app has the same
  pending requirement).
- **Authentication → URL Configuration**: add `co.africamart.app://auth-callback`
  as an additional redirect URL, so the Google OAuth round-trip (opened in
  the system browser, then redirected back into the app) can complete.

## How auth works here

- Email/password and Google OAuth both go through Supabase Auth, gated by a
  Cloudflare Turnstile token (the same bot-protection the web login/signup
  forms use) — rendered via a hidden WebView bridge
  (`src/components/TurnstileWidget.tsx`), since Turnstile has no native SDK.
- Google sign-in opens the system browser (`expo-web-browser`), not an
  in-app WebView — this is what makes Google sign-in work at all on mobile;
  Google blocks OAuth inside embedded WebViews ("disallowed_useragent"),
  which was the blocker noted in this repo's previous (Capacitor wrapper)
  version.
- Sessions persist across app restarts via `expo-secure-store`, with the
  bulk of the session blob AES-encrypted into AsyncStorage
  (`src/lib/largeSecureStore.ts`) — SecureStore alone caps values at ~2KB on
  Android, too small for a Supabase session.

## Project structure

```
src/
  config/env.ts        Supabase URL/anon key, Turnstile site key
  lib/                  Supabase client, secure session storage
  store/                Zustand stores: auth session, cached bootstrap data
  services/             One module per backend domain (auth, catalog,
                         storefront, rfq, buyer, supplier) — same tables/
                         RPCs/endpoints as the web app's equivalents
  navigation/            Auth stack, bottom tabs, per-tab stacks
  screens/               auth/, marketplace/, rfq/, buyer/, supplier/
  components/            TurnstileWidget, ProductCard, SupplierCard
```

## App identity

- Package ID: `co.africamart.app`
- App name: AfricaMart
- Deep link scheme: `co.africamart.app://`
