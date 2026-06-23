import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import {
  buildAuthState,
  ensureBuyerRecord,
  ensureSupplierRecord,
  getProfiles,
  type AuthState,
  type ProfileRef,
  type Role,
} from "../services/auth.service";

interface AuthStoreState {
  initializing: boolean;
  session: Session | null;
  authState: AuthState | null;
  buyerProfile: ProfileRef | null;
  supplierProfile: ProfileRef | null;
  activeRole: Role | undefined;
  init: () => Promise<void>;
  refreshProfiles: () => Promise<void>;
  setActiveRole: (role: Role) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  initializing: true,
  session: null,
  authState: null,
  buyerProfile: null,
  supplierProfile: null,
  activeRole: undefined,

  init: async () => {
    const { data } = await supabase.auth.getSession();
    await applySession(data.session, set, get);
    set({ initializing: false });

    supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session, set, get);
    });
  },

  refreshProfiles: async () => {
    const userId = get().session?.user.id;
    if (!userId) return;
    const profiles = await getProfiles(userId);
    set({ buyerProfile: profiles.buyer, supplierProfile: profiles.supplier });
  },

  setActiveRole: (role) => set({ activeRole: role }),

  clear: () =>
    set({ session: null, authState: null, buyerProfile: null, supplierProfile: null, activeRole: undefined }),
}));

async function applySession(
  session: Session | null,
  set: (partial: Partial<AuthStoreState>) => void,
  get: () => AuthStoreState
) {
  const activeRole = get().activeRole;
  const authState = buildAuthState(session?.user ?? null, activeRole);
  set({ session, authState, activeRole: authState?.role });

  if (session?.user) {
    // Idempotent — mirrors auth.page.jsx's afterSignIn(): make sure the
    // buyer/supplier row for this account's role exists before the
    // dashboard tries to read it. Non-fatal: row may already exist, or RLS
    // may be pending email confirmation.
    try {
      if (authState?.role === "supplier") {
        await ensureSupplierRecord(session.user);
      } else {
        await ensureBuyerRecord(session.user);
      }
    } catch (e) {
      console.warn("[AfricaMart] Could not create profile row:", e);
    }
    const profiles = await getProfiles(session.user.id);
    set({ buyerProfile: profiles.buyer, supplierProfile: profiles.supplier });
  } else {
    set({ buyerProfile: null, supplierProfile: null });
  }
}
