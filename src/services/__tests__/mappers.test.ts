import {
  formatDeadline,
  formatMonthYear,
  mapCategory,
  mapCountry,
  mapCurrency,
  mapOrder,
  mapProduct,
  mapQuote,
  mapReview,
  mapRFQ,
  mapSupplier,
  timeAgo,
} from "../mappers";

describe("mapCountry", () => {
  it("maps a country row", () => {
    expect(mapCountry({ code: "NG", name: "Nigeria", flag_colors: "#0f0", currency_code: "NGN" })).toEqual({
      code: "NG",
      name: "Nigeria",
      flag: "#0f0",
      cur: "NGN",
    });
  });
});

describe("mapCurrency", () => {
  it("parses the USD rate as a float", () => {
    expect(mapCurrency({ symbol: "$", rate_to_usd: "1.00" })).toEqual({ sym: "$", rate: 1 });
  });
});

describe("mapCategory", () => {
  it("maps a category row", () => {
    expect(mapCategory({ id: "c1", name: "Textiles", icon: "🧵", listing_count: 12, hue: "blue" })).toEqual({
      id: "c1",
      name: "Textiles",
      icon: "🧵",
      count: 12,
      hue: "blue",
    });
  });
});

describe("mapProduct", () => {
  const baseRow = {
    id: "p1",
    slug: "widget",
    public_id: "PUB1",
    supplier_id: "s1",
    category_id: "c1",
    name: "Widget",
    sku: "SKU1",
    price_usd: "19.99",
    unit: "piece",
    moq: "10",
    moq_unit: "piece",
    tags: ["a", "b"],
    inquiry_count: 3,
    views_count: 40,
    status: "active",
    description: "A widget",
    specs: [{ k: "v" }],
    certs: ["ISO9001"],
    origin_country: "NG",
    image_url: "http://img",
    attachments: [{ url: "http://a" }],
    price_tiers: [{ min: 1, price: 19.99 }],
  };

  it("parses numeric fields and passes through arrays", () => {
    expect(mapProduct(baseRow)).toEqual({
      id: "p1",
      slug: "widget",
      publicId: "PUB1",
      supplier: "s1",
      cat: "c1",
      name: "Widget",
      sku: "SKU1",
      priceUSD: 19.99,
      unit: "piece",
      moq: 10,
      moqUnit: "piece",
      tags: ["a", "b"],
      inquiries: 3,
      views: 40,
      status: "active",
      desc: "A widget",
      specs: [{ k: "v" }],
      certs: ["ISO9001"],
      originCountry: "NG",
      image: "http://img",
      attachments: [{ url: "http://a" }],
      priceTiers: [{ min: 1, price: 19.99 }],
    });
  });

  it("falls back to [] for a JSON-string specs field and null origin/image", () => {
    const row = { ...baseRow, specs: '[{"k":"v"}]', origin_country: null, image_url: null, tags: null, attachments: null };
    const product = mapProduct(row);
    expect(product.specs).toEqual([{ k: "v" }]);
    expect(product.originCountry).toBeNull();
    expect(product.image).toBeNull();
    expect(product.tags).toEqual([]);
  });
});

describe("mapSupplier", () => {
  it("maps a supplier row, defaulting color when absent", () => {
    const row = {
      id: "s1",
      slug: "acme",
      public_id: "PUBS1",
      name: "Acme",
      country_code: "NG",
      phone: "+234",
      category_id: "c1",
      kind: "product",
      tier: "free",
      verified: true,
      rating: "4.5",
      review_count: 10,
      response_rate: 90,
      response_time: "1 hr",
      since: 2020,
      products_count: 5,
      bio: "We make things",
      type: "manufacturer",
      color: null,
      tags: ["a"],
      certs: ["ISO"],
      capabilities: { paint: true },
      status: "active",
      logo_url: "http://logo",
      banner_url: "http://banner",
      about_image_url: null,
      website_url: null,
      business_hours: null,
    };
    const supplier = mapSupplier(row);
    expect(supplier.rating).toBe(4.5);
    expect(supplier.color).toBe("#5a6b7a");
    expect(supplier.aboutImageUrl).toBeNull();
  });
});

describe("mapReview", () => {
  it("maps a review row, using date_label when present", () => {
    expect(
      mapReview({ buyer_name: "Jane", buyer_country: "KE", rating: 5, date_label: "Jan 2026", body: "Great supplier" })
    ).toEqual({ buyer: "Jane", country: "KE", rating: 5, date: "Jan 2026", text: "Great supplier" });
  });

  it("falls back to a formatted month/year when date_label is absent", () => {
    const review = mapReview({ buyer_name: "Jane", buyer_country: "KE", rating: 5, created_at: "2026-01-15T00:00:00Z", body: "Great" });
    expect(review.date).toBe(formatMonthYear("2026-01-15T00:00:00Z"));
  });
});

describe("mapRFQ", () => {
  it("maps an rfq row and formats posted/deadline", () => {
    const row = {
      id: "r1",
      buyer_id: "b1",
      title: "Need widgets",
      category_id: "c1",
      quantity_text: "1000 units",
      destination_country: "NG",
      buyer_name: "Jane Co",
      created_at: new Date().toISOString(),
      deadline: "2026-12-31",
      quotes_count: 2,
      status: "open",
      description: "desc",
    };
    const rfq = mapRFQ(row);
    expect(rfq.id).toBe("r1");
    expect(rfq.posted).toBe("Just now");
    expect(rfq.deadline).toBe(formatDeadline("2026-12-31"));
  });

  it("returns an empty deadline string when there is none", () => {
    const rfq = mapRFQ({ id: "r1", buyer_id: "b1", title: "t", category_id: "c", quantity_text: "q", destination_country: "NG", buyer_name: "n", created_at: new Date().toISOString(), deadline: null, quotes_count: 0, status: "open", description: "" });
    expect(rfq.deadline).toBe("");
  });
});

describe("mapQuote", () => {
  it("maps a quote row with a joined supplier", () => {
    const row = {
      id: "q1",
      rfq_id: "r1",
      supplier_id: "s1",
      price_usd: 100,
      lead_time_text: "2 weeks",
      message: "hello",
      payment_terms: "30% upfront",
      incoterm: "FOB",
      certs: ["ISO"],
      status: "pending",
      created_at: new Date().toISOString(),
      suppliers: { name: "Acme", slug: "acme", rating: "4.2", verified: true, country_code: "NG", tier: "free" },
    };
    const quote = mapQuote(row);
    expect(quote.supplier).toEqual({ name: "Acme", slug: "acme", rating: 4.2, verified: true, country: "NG", tier: "free" });
  });

  it("handles a missing joined supplier gracefully", () => {
    const quote = mapQuote({ id: "q1", rfq_id: "r1", supplier_id: "s1", price_usd: 100, lead_time_text: "2w", message: null, payment_terms: null, incoterm: null, certs: [], status: "pending", created_at: new Date().toISOString() });
    expect(quote.supplier.name).toBeUndefined();
    expect(quote.supplier.rating).toBeNull();
  });
});

describe("mapOrder", () => {
  it("maps an order row including the joined supplier and a derived supplierId", () => {
    const row = {
      id: "o1",
      product_name: "Widgets",
      supplier_id: "s1",
      value_usd: "500",
      currency: "USD",
      status: "processing",
      created_at: "2026-01-15T10:00:00Z",
      suppliers: { name: "Acme", slug: "acme", public_id: "PUBS1" },
    };
    expect(mapOrder(row)).toEqual({
      id: "o1",
      productName: "Widgets",
      supplierId: "s1",
      supplierName: "Acme",
      supplierSlug: "acme",
      supplierPublicId: "PUBS1",
      value: 500,
      currency: "USD",
      status: "processing",
      date: "2026-01-15",
    });
  });

  it("nulls out supplier fields when there's no joined supplier", () => {
    const order = mapOrder({ id: "o1", product_name: "Widgets", supplier_id: null, value_usd: "0", currency: "USD", status: "processing", created_at: null });
    expect(order.supplierId).toBeNull();
    expect(order.supplierName).toBeNull();
    expect(order.date).toBe("");
  });
});

describe("timeAgo", () => {
  it("says 'Just now' for very recent timestamps", () => {
    expect(timeAgo(new Date().toISOString())).toBe("Just now");
  });

  it("reports minutes, hours, and days for older timestamps", () => {
    const minutesAgo = new Date(Date.now() - 10 * 60000).toISOString();
    expect(timeAgo(minutesAgo)).toBe("10 min ago");

    const hoursAgo = new Date(Date.now() - 5 * 3600000).toISOString();
    expect(timeAgo(hoursAgo)).toBe("5 hrs ago");

    const daysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
    expect(timeAgo(daysAgo)).toBe("2 days ago");
  });

  it("falls back to month/year formatting past a week", () => {
    const weeksAgo = new Date(Date.now() - 10 * 86400000).toISOString();
    expect(timeAgo(weeksAgo)).toBe(formatMonthYear(weeksAgo));
  });
});
