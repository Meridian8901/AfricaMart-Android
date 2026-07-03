import { makeQueryBuilder } from "./testUtils";

import { acceptQuote, getOpenRFQs } from "../rfq.service";

const mockFrom = jest.fn();
const mockRpc = jest.fn();
jest.mock("../../lib/supabaseClient", () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args), rpc: (...args: unknown[]) => mockRpc(...args) },
}));

describe("getOpenRFQs", () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it("filters to open rfqs, newest first, with no category filter by default", async () => {
    const builder = makeQueryBuilder({ data: [], error: null });
    mockFrom.mockReturnValue(builder);

    await getOpenRFQs();

    expect(builder.eq).toHaveBeenCalledWith("status", "open");
    expect(builder.eq).not.toHaveBeenCalledWith("category_id", expect.anything());
    expect(builder.order).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("also filters by category when one is given", async () => {
    const builder = makeQueryBuilder({ data: [], error: null });
    mockFrom.mockReturnValue(builder);

    await getOpenRFQs("c1");

    expect(builder.eq).toHaveBeenCalledWith("status", "open");
    expect(builder.eq).toHaveBeenCalledWith("category_id", "c1");
  });
});

describe("acceptQuote", () => {
  beforeEach(() => {
    mockFrom.mockReset();
    mockRpc.mockReset();
  });

  it("accepts the quote, declines the rest, awards the rfq, and creates an order", async () => {
    const rfqQuotesBuilder = makeQueryBuilder({ data: { supplier_id: "s1", price_usd: 500 }, error: null });
    const rfqsBuilder = makeQueryBuilder({ data: { buyer_id: "b1", title: "Need widgets", destination_country: "NG" }, error: null });
    const ordersBuilder = makeQueryBuilder({ data: null, error: null });
    mockFrom.mockImplementation((table: string) => ({ rfq_quotes: rfqQuotesBuilder, rfqs: rfqsBuilder, orders: ordersBuilder })[table]);
    mockRpc.mockResolvedValue({ data: "ORD123", error: null });

    await acceptQuote("r1", "q1");

    expect(rfqQuotesBuilder.update).toHaveBeenCalledWith({ status: "accepted" });
    expect(rfqQuotesBuilder.update).toHaveBeenCalledWith({ status: "declined" });
    expect(rfqsBuilder.update).toHaveBeenCalledWith({ status: "awarded" });
    expect(mockRpc).toHaveBeenCalledWith("generate_order_id");
    expect(ordersBuilder.insert).toHaveBeenCalledWith({
      id: "ORD123",
      buyer_id: "b1",
      supplier_id: "s1",
      product_id: null,
      product_name: "Need widgets",
      value_usd: 500,
      commission_usd: 0,
      status: "processing",
      destination_country: "NG",
    });
  });

  it("stops and throws before awarding if accepting the quote itself fails", async () => {
    mockFrom.mockReturnValue(makeQueryBuilder({ data: null, error: new Error("update failed") }));

    await expect(acceptQuote("r1", "q1")).rejects.toThrow("update failed");
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
