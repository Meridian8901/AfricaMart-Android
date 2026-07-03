import { makeQueryBuilder } from "./testUtils";

import { getBuyerRFQs, saveBuyerSettings } from "../buyer.service";

const mockFrom = jest.fn();
jest.mock("../../lib/supabaseClient", () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

describe("getBuyerRFQs", () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it("queries rfqs scoped to the buyer, newest first, and maps the rows", async () => {
    const builder = makeQueryBuilder({
      data: [{ id: "r1", buyer_id: "b1", title: "Need widgets", category_id: "c1", quantity_text: "100 units", destination_country: "NG", buyer_name: "Jane", created_at: new Date().toISOString(), deadline: null, quotes_count: 0, status: "open", description: "" }],
      error: null,
    });
    mockFrom.mockReturnValue(builder);

    const rfqs = await getBuyerRFQs("b1");

    expect(mockFrom).toHaveBeenCalledWith("rfqs");
    expect(builder.eq).toHaveBeenCalledWith("buyer_id", "b1");
    expect(builder.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(rfqs).toHaveLength(1);
    expect(rfqs[0]).toMatchObject({ id: "r1", title: "Need widgets" });
  });

  it("throws when the query errors", async () => {
    mockFrom.mockReturnValue(makeQueryBuilder({ data: null, error: new Error("db down") }));
    await expect(getBuyerRFQs("b1")).rejects.toThrow("db down");
  });
});

describe("saveBuyerSettings", () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it("updates both the profile and buyer rows", async () => {
    const profileBuilder = makeQueryBuilder({ data: null, error: null });
    const buyerBuilder = makeQueryBuilder({ data: null, error: null });
    mockFrom.mockImplementation((table: string) => (table === "profiles" ? profileBuilder : buyerBuilder));

    await saveBuyerSettings("p1", "b1", { name: "Jane", phone: "+234", countryCode: "NG" });

    expect(profileBuilder.update).toHaveBeenCalledWith(expect.objectContaining({ phone: "+234", country_code: "NG" }));
    expect(profileBuilder.eq).toHaveBeenCalledWith("id", "p1");
    expect(buyerBuilder.update).toHaveBeenCalledWith(expect.objectContaining({ name: "Jane", country_code: "NG" }));
    expect(buyerBuilder.eq).toHaveBeenCalledWith("id", "b1");
  });

  it("throws if either update errors, even when the other succeeds", async () => {
    mockFrom.mockImplementation((table: string) =>
      table === "profiles" ? makeQueryBuilder({ data: null, error: new Error("profile update failed") }) : makeQueryBuilder({ data: null, error: null })
    );

    await expect(saveBuyerSettings("p1", "b1", { name: "Jane" })).rejects.toThrow("profile update failed");
  });
});
