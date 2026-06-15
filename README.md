# AfricaMart — Android app (Capacitor wrapper)

A thin native shell around the live marketplace at `https://africamart.co`.
The WebView loads the production site directly (see `capacitor.config.json`
→ `server.url`), so every web deploy updates the app instantly — no app
store release needed for content/feature changes.

## Prerequisites

- [Android Studio](https://developer.android.com/studio) (bundles a
  compatible JDK and the Android SDK). The system Java here is 1.8, which is
  too old for the Capacitor 6 / Android Gradle Plugin toolchain — use the JDK
  that ships with Android Studio.

## Setup

```
cd mobile
npm install
```

The `android/` project is already generated and committed. After pulling
changes, re-sync with:

```
npx cap sync android
```

## Build / run

Open in Android Studio and run on a device or emulator:

```
npx cap open android
```

Or build a debug APK from the command line (once Android Studio's SDK is on
your PATH):

```
cd android
./gradlew assembleDebug
```

## Known follow-up: Google sign-in

Google blocks OAuth inside embedded WebViews ("disallowed_useragent"). The
web app's Google sign-in (`apps/marketplace/features/auth/auth.service.js`)
will likely fail inside this wrapper as-is. Email/password sign-in works
fine. To support Google sign-in in-app, we'll need to add
`@capacitor/browser` to open the OAuth flow in the system browser and a
custom URL scheme (`co.africamart.app://`) redirect back into the app —
not yet implemented.

## App identity

- Package ID: `co.africamart.app`
- App name: AfricaMart
