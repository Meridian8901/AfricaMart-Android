import { makeQueryBuilder } from "./testUtils";

import { createProduct, saveSupplierStore } from "../supplier.service";

const mockFrom = jest.fn();
jest.mock("../../lib/supabaseClient", () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

describe("createProduct", () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it("inserts a slugified product row and maps the result", async () => {
    const builder = makeQueryBuilder({
      data: { id: "p1", slug: "widget-abc", public_id: "PUB1", supplier_id: "s1", category_id: "c1", name: "Widget", sku: null, price_usd: "19.99", unit: "piece", moq: "10", moq_unit: "piece", tags: [], inquiry_count: 0, views_count: 0, status: "active", description: null, specs: [], certs: [], origin_country: null, image_url: null, attachments: [], price_tiers: [] },
      error: null,
    });
    mockFrom.mockReturnValue(builder);

    const product = await createProduct("s1", { name: "Widget", price: "19.99", unit: "piece", moq: "10" });

    expect(mockFrom).toHaveBeenCalledWith("products");
    const insertedRow = builder.insert.mock.calls[0][0];
    expect(insertedRow.supplier_id).toBe("s1");
    expect(insertedRow.name).toBe("Widget");
    expect(insertedRow.price_usd).toBe(19.99);
    expect(insertedRow.slug.startsWith("widget-")).toBe(true);
    expect(product).toMatchObject({ id: "p1", name: "Widget" });
  });

  it("throws when the insert errors", async () => {
    mockFrom.mockReturnValue(makeQueryBuilder({ data: null, error: new Error("insert failed") }));
    await expect(createProduct("s1", { name: "Widget" })).rejects.toThrow("insert failed");
  });
});

describe("saveSupplierStore", () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it("updates the supplier row, coercing 'since' to a number", async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder);

    await saveSupplierStore("s1", { bio: "We make widgets", since: "2020", websiteUrl: "https://acme.example" });

    expect(mockFrom).toHaveBeenCalledWith("suppliers");
    expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({ bio: "We make widgets", since: 2020, website_url: "https://acme.example" }));
    expect(builder.eq).toHaveBeenCalledWith("id", "s1");
  });

  it("nulls 'since' when omitted", async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder);

    await saveSupplierStore("s1", { bio: "We make widgets" });

    expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({ since: null }));
  });
});
