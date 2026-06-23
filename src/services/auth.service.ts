import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "../lib/supabaseClient";
import type { Session, User } from "@supabase/supabase-js";

export type Role = "buyer" | "supplier";

export interface AuthState {
  user: User;
  role: Role;
  name: string;
  company: string;
  initials: string;
  sub: string;
  email: string;
}

export interface ProfileRef {
  id: string;
  active: boolean;
}

function slugify(str: string): string {
  return (str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function initials(name: string): string {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// captchaToken comes from <TurnstileWidget> — the Supabase project has
// Turnstile captcha protection enabled on the Auth API itself (see
// d:\Afrimart\apps\marketplace\features\auth\auth.page.jsx), so signIn/signUp
// are rejected server-side without a valid token, same as on web.
export async function signIn(email: string, password: string, captchaToken: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: { captchaToken },
  });
  if (error) throw error;
  return data;
}

export async function signUp(
  email: string,
  password: string,
  meta: Record<string, unknown>,
  captchaToken: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: meta, captchaToken },
  });
  if (error) throw error;
  return data;
}

// Opens Google's OAuth consent in the system browser (not an in-app WebView),
// which avoids Google's "disallowed_useragent" block that the old Capacitor
// wrapper hit. PKCE: Supabase returns a `code` on the deep-link redirect,
// which we exchange for a session — see RootNavigator's deep-link handler.
export async function signInWithGoogle() {
  const redirectTo = Linking.createURL("auth-callback");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success" || !result.url) {
    throw new Error("Google sign-in was cancelled");
  }

  const { queryParams } = Linking.parse(result.url);
  if (!queryParams?.code) throw new Error("No authorization code returned");

  const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(
    String(queryParams.code)
  );
  if (exchangeError) throw exchangeError;
  return sessionData;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function updateUser(attrs: Record<string, unknown>) {
  const { data, error } = await supabase.auth.updateUser(attrs);
  if (error) throw error;
  return data;
}

export async function resetPasswordForEmail(email: string, captchaToken: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: Linking.createURL("reset-password"),
    captchaToken,
  });
  if (error) throw error;
}

export function buildAuthState(user: User | null, roleOverride?: Role): AuthState | null {
  if (!user) return null;
  const meta = (user.user_metadata || {}) as Record<string, string>;
  const role: Role = roleOverride || (meta.role as Role) || "buyer";
  const name = meta.name || meta.full_name || (user.email ?? "").split("@")[0];
  const company = meta.company || "";
  const sub = company ? `${company} · ${role === "supplier" ? "Supplier" : "Buyer"}` : role === "supplier" ? "Supplier" : "Buyer";
  return { user, role, name, company, initials: initials(name), sub, email: user.email ?? "" };
}

export async function getProfiles(userId: string): Promise<{ buyer: ProfileRef | null; supplier: ProfileRef | null }> {
  const [buyerRes, supplierRes] = await Promise.all([
    supabase.from("buyers").select("id,deactivated_at").eq("profile_id", userId).limit(1).maybeSingle(),
    supabase.from("suppliers").select("id,deactivated_at").eq("profile_id", userId).limit(1).maybeSingle(),
  ]);
  return {
    buyer: buyerRes.data ? { id: buyerRes.data.id, active: !buyerRes.data.deactivated_at } : null,
    supplier: supplierRes.data ? { id: supplierRes.data.id, active: !supplierRes.data.deactivated_at } : null,
  };
}

export async function setProfileActive(role: Role, id: string, active: boolean) {
  const table = role === "supplier" ? "suppliers" : "buyers";
  const { error } = await supabase
    .from(table)
    .update({ deactivated_at: active ? null : new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function ensureBuyerRecord(user: User, extra: Record<string, string> = {}) {
  const { data: existing } = await supabase
    .from("buyers")
    .select("id")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existing) return existing;

  const meta = (user.user_metadata || {}) as Record<string, string>;
  const { data, error } = await supabase
    .from("buyers")
    .insert({
      profile_id: user.id,
      name: extra.company || meta.company || meta.name || user.email,
      contact_name: meta.name || user.email,
      email: user.email,
      country_code: extra.country_code || meta.country_code || null,
      tier: "standard",
      status: "pending",
      risk: "low",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function ensureSupplierRecord(user: User, extra: Record<string, string> = {}) {
  const { data: existing } = await supabase
    .from("suppliers")
    .select("id")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existing) return existing;

  const meta = (user.user_metadata || {}) as Record<string, string>;
  const company = extra.company || meta.company || meta.name || "My Company";
  const base = slugify(company);
  let data, error;
  for (let attempt = 1; attempt <= 10; attempt++) {
    const slug = attempt === 1 ? base : `${base}-${attempt}`;
    ({ data, error } = await supabase
      .from("suppliers")
      .insert({
        profile_id: user.id,
        slug,
        name: company,
        country_code: extra.country_code || meta.country_code || null,
        phone: extra.phone || meta.phone || null,
        kind: "product",
        tier: "free",
        status: "pending",
        kyc_status: "incomplete",
        risk: "low",
      })
      .select()
      .single());
    if (!error) return data;
    if (!error.message.includes("duplicate") && !error.message.includes("unique")) throw error;
  }
  throw error;
}
