// Demonstrates the pattern for testing a service function that calls the
// Supabase client directly: mock "../../lib/supabaseClient" and stub out
// just the client methods the function under test actually calls.
jest.mock("../../lib/supabaseClient", () => ({
  supabase: { rpc: jest.fn() },
}));

import { supabase } from "../../lib/supabaseClient";
import { searchProducts } from "../catalog.service";

const mockRpc = supabase.rpc as jest.Mock;

describe("searchProducts", () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it("maps rows and derives the total from the first row's total_count", async () => {
    mockRpc.mockResolvedValue({
      data: [
        { id: "p1", slug: "widget", public_id: "PUB1", supplier_id: "s1", category_id: "c1", name: "Widget", sku: "SKU1", price_usd: "9.99", unit: "piece", moq: "5", moq_unit: "piece", tags: [], inquiry_count: 1, views_count: 2, description: "d", specs: [], certs: [], price_tiers: [], image_url: null, attachments: [], origin_country: null, total_count: "42" },
      ],
      error: null,
    });

    const result = await searchProducts({ q: "widget" });

    expect(mockRpc).toHaveBeenCalledWith(
      "search_products",
      expect.objectContaining({ search_text: "widget", p_sort_by: "inquired", p_page: 1, p_page_size: 24 })
    );
    expect(result.total).toBe(42);
    expect(result.products).toHaveLength(1);
    expect(result.products[0]).toMatchObject({ id: "p1", name: "Widget", priceUSD: 9.99 });
  });

  it("returns an empty result set with total 0 when there are no matches", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    const result = await searchProducts({});
    expect(result).toEqual({ products: [], total: 0 });
  });

  it("throws when the RPC call errors", async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error("boom") });
    await expect(searchProducts({})).rejects.toThrow("boom");
  });
});
