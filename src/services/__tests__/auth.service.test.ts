// auth.service.ts imports the real Supabase client at module scope (for its
// other exports), which pulls in AsyncStorage — unavailable outside a native
// runtime. buildAuthState itself is pure and never touches supabase, so mock
// the client module out rather than exercising the whole native storage chain.
jest.mock("../../lib/supabaseClient", () => ({ supabase: {} }));

import { buildAuthState } from "../auth.service";
import type { User } from "@supabase/supabase-js";

function makeUser(overrides: Partial<User> & { user_metadata?: Record<string, unknown> } = {}): User {
  return {
    id: "u1",
    email: "jane@example.com",
    user_metadata: {},
    app_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
    ...overrides,
  } as User;
}

describe("buildAuthState", () => {
  it("returns null when there's no user", () => {
    expect(buildAuthState(null)).toBeNull();
  });

  it("defaults to the buyer role and derives initials from name metadata", () => {
    const user = makeUser({ user_metadata: { name: "Jane Doe", company: "Acme Co" } });
    const state = buildAuthState(user);
    expect(state).not.toBeNull();
    expect(state!.role).toBe("buyer");
    expect(state!.name).toBe("Jane Doe");
    expect(state!.initials).toBe("JD");
    expect(state!.sub).toBe("Acme Co · Buyer");
  });

  it("uses the supplier role from metadata and labels the sub line accordingly", () => {
    const user = makeUser({ user_metadata: { name: "Sam", role: "supplier", company: "Widgets Inc" } });
    const state = buildAuthState(user);
    expect(state!.role).toBe("supplier");
    expect(state!.sub).toBe("Widgets Inc · Supplier");
  });

  it("prefers an explicit roleOverride over metadata", () => {
    const user = makeUser({ user_metadata: { role: "buyer" } });
    const state = buildAuthState(user, "supplier");
    expect(state!.role).toBe("supplier");
  });

  it("falls back to the email prefix as the name, and omits company from sub when absent", () => {
    const user = makeUser({ email: "sam@example.com", user_metadata: {} });
    const state = buildAuthState(user);
    expect(state!.name).toBe("sam");
    expect(state!.sub).toBe("Buyer");
    expect(state!.initials).toBe("S");
  });
});
