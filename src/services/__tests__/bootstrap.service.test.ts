import { makeQueryBuilder } from "./testUtils";

import { getCountries, getStats } from "../bootstrap.service";

const mockFrom = jest.fn();
const mockRpc = jest.fn();
jest.mock("../../lib/supabaseClient", () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args), rpc: (...args: unknown[]) => mockRpc(...args) },
}));

describe("getCountries", () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it("orders by name and maps each row", async () => {
    const builder = makeQueryBuilder({ data: [{ code: "NG", name: "Nigeria", flag_colors: "#0f0", currency_code: "NGN" }], error: null });
    mockFrom.mockReturnValue(builder);

    const countries = await getCountries();

    expect(mockFrom).toHaveBeenCalledWith("countries");
    expect(builder.order).toHaveBeenCalledWith("name");
    expect(countries).toEqual([{ code: "NG", name: "Nigeria", flag: "#0f0", cur: "NGN" }]);
  });
});

describe("getStats", () => {
  beforeEach(() => {
    mockFrom.mockReset();
    mockRpc.mockReset();
  });

  it("combines the active-product count with the buyers count RPC", async () => {
    mockFrom.mockReturnValue(makeQueryBuilder({ data: null, error: null, count: 120 }));
    mockRpc.mockResolvedValue({ data: [{ buyers_count: "45" }], error: null });

    const stats = await getStats();

    expect(mockRpc).toHaveBeenCalledWith("get_public_stats");
    expect(stats).toEqual({ products: 120, buyers: 45 });
  });

  it("throws if the buyers-count RPC errors, even though the product count succeeded", async () => {
    mockFrom.mockReturnValue(makeQueryBuilder({ data: null, error: null, count: 120 }));
    mockRpc.mockResolvedValue({ data: null, error: new Error("rpc failed") });

    await expect(getStats()).rejects.toThrow("rpc failed");
  });
});
