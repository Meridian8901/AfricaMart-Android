// Shared chainable query-builder mock for testing functions that call
// supabase.from(...).<chain of filters>.<single|maybeSingle, or awaited
// directly>. Mirrors the real supabase-js builder: every filter method
// returns the same builder, and the builder itself is thenable so `await`ing
// it directly (without .single()/.maybeSingle()) also resolves.
export function makeQueryBuilder(result: { data: unknown; error: unknown; count?: number }) {
  const builder: any = {};
  const chainMethods = ["select", "eq", "neq", "in", "order", "limit", "gte", "lt", "insert", "update", "upsert", "delete"];
  chainMethods.forEach((method) => {
    builder[method] = jest.fn(() => builder);
  });
  builder.single = jest.fn(() => Promise.resolve(result));
  builder.maybeSingle = jest.fn(() => Promise.resolve(result));
  builder.then = (onResolve: (r: typeof result) => unknown, onReject?: (e: unknown) => unknown) =>
    Promise.resolve(result).then(onResolve, onReject);
  return builder;
}
