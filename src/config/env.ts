// Same Supabase project + Turnstile site key the web app (d:\Afrimart\core\config.js) uses.
// Both are public/client-safe keys (anon key + Turnstile site key) — no secrets here.
//
// Overridable via EXPO_PUBLIC_* vars in a .env file (see .env.example) so a
// developer can point a local build at a different backend (e.g. a staging
// Supabase project) without touching this file. Expo auto-loads .env /
// .env.local at build time — see PROJECT_OVERVIEW.md §7 for details. The
// literals below are the defaults and are what ship if no .env is present.
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://grtfuctlinnjcsbpjwuh.supabase.co";
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdydGZ1Y3RsaW5uamNzYnBqd3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjQzNDIsImV4cCI6MjA5NjYwMDM0Mn0.tlsYEB6hI0vKRtA4Ytbdn-Glg8czpzR5qWfhEyeAD80";
export const TURNSTILE_SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAADkKJnvhYCJ0Ex6M";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "https://africamart.co";
