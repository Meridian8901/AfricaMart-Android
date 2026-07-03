import { submitReview } from "../storefront.service";

// Same mocking pattern as catalog.service.test.ts, but for the chainable
// query-builder style calls (`.from().insert().select().single()`) used by
// most of the write-path service functions.
function makeQueryBuilder(result: { data: unknown; error: unknown }) {
  const builder: any = {
    insert: jest.fn(() => builder),
    select: jest.fn(() => builder),
    single: jest.fn(() => Promise.resolve(result)),
  };
  return builder;
}

const mockFrom = jest.fn();
jest.mock("../../lib/supabaseClient", () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

describe("submitReview", () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it("inserts a row matching the reviews table's read-side column names", async () => {
    const builder = makeQueryBuilder({
      data: { buyer_name: "Jane", buyer_country: "NG", rating: 5, body: "Great supplier", created_at: new Date().toISOString() },
      error: null,
    });
    mockFrom.mockReturnValue(builder);

    const review = await submitReview({ supplierId: "s1", buyerName: "Jane", buyerCountry: "NG", rating: 5, text: "Great supplier" });

    expect(mockFrom).toHaveBeenCalledWith("reviews");
    expect(builder.insert).toHaveBeenCalledWith({
      supplier_id: "s1",
      buyer_name: "Jane",
      buyer_country: "NG",
      rating: 5,
      body: "Great supplier",
    });
    expect(review).toMatchObject({ buyer: "Jane", country: "NG", rating: 5, text: "Great supplier" });
  });

  it("throws when the insert errors", async () => {
    const builder = makeQueryBuilder({ data: null, error: new Error("insert failed") });
    mockFrom.mockReturnValue(builder);

    await expect(submitReview({ supplierId: "s1", buyerName: "Jane", rating: 5, text: "Great" })).rejects.toThrow("insert failed");
  });
});
