// Field mappers — mirror d:\Afrimart\core\data-loader.js exactly so the
// mobile app reads the same DB rows into the same shapes the web app uses.

export interface Country {
  code: string;
  name: string;
  flag: string;
  cur: string;
}

export interface Currency {
  sym: string;
  rate: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
  hue: string;
}

export interface Product {
  id: string;
  slug: string;
  publicId: string;
  supplier: string;
  cat: string;
  name: string;
  sku: string;
  priceUSD: number;
  unit: string;
  moq: number;
  moqUnit: string;
  tags: string[];
  inquiries: number;
  views: number;
  status: string;
  desc: string;
  specs: unknown[];
  certs: string[];
  originCountry: string | null;
  image?: string | null;
  attachments?: unknown[];
  priceTiers?: unknown[];
}

export interface Supplier {
  id: string;
  slug: string;
  publicId: string;
  name: string;
  country: string;
  phone: string | null;
  cat: string;
  kind: string;
  tier: string;
  verified: boolean;
  rating: number;
  reviews: number;
  responseRate: number;
  responseTime: string;
  since: number;
  products: number;
  bio: string;
  type: string;
  color: string;
  tags: string[];
  certs: string[];
  capabilities: Record<string, unknown>;
  status: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  aboutImageUrl: string | null;
  websiteUrl: string | null;
  businessHours: string | null;
  serviceType?: string;
  coverage?: string[];
}

export function mapCountry(row: any): Country {
  return { code: row.code, name: row.name, flag: row.flag_colors, cur: row.currency_code };
}

export function mapCurrency(row: any): Currency {
  return { sym: row.symbol, rate: parseFloat(row.rate_to_usd) };
}

export function mapCategory(row: any): Category {
  return { id: row.id, name: row.name, icon: row.icon, count: row.listing_count, hue: row.hue };
}

export function mapProduct(row: any): Product {
  return {
    id: row.id,
    slug: row.slug,
    publicId: row.public_id,
    supplier: row.supplier_id,
    cat: row.category_id,
    name: row.name,
    sku: row.sku,
    priceUSD: parseFloat(row.price_usd),
    unit: row.unit,
    moq: parseFloat(row.moq),
    moqUnit: row.moq_unit,
    tags: row.tags || [],
    inquiries: row.inquiry_count,
    views: row.views_count,
    status: row.status,
    desc: row.description,
    specs: Array.isArray(row.specs) ? row.specs : JSON.parse(row.specs || "[]"),
    certs: row.certs || [],
    originCountry: row.origin_country || null,
    image: row.image_url || null,
    attachments: row.attachments || [],
    priceTiers: Array.isArray(row.price_tiers) ? row.price_tiers : [],
  };
}

export function mapSupplier(row: any): Supplier {
  return {
    id: row.id,
    slug: row.slug,
    publicId: row.public_id,
    name: row.name,
    country: row.country_code,
    phone: row.phone,
    cat: row.category_id,
    kind: row.kind,
    tier: row.tier,
    verified: row.verified,
    rating: parseFloat(row.rating),
    reviews: row.review_count,
    responseRate: row.response_rate,
    responseTime: row.response_time,
    since: row.since,
    products: row.products_count,
    bio: row.bio,
    type: row.type,
    color: row.color || "#5a6b7a",
    tags: row.tags || [],
    certs: row.certs || [],
    capabilities: row.capabilities || {},
    status: row.status,
    logoUrl: row.logo_url,
    bannerUrl: row.banner_url,
    aboutImageUrl: row.about_image_url || null,
    websiteUrl: row.website_url || null,
    businessHours: row.business_hours || null,
    serviceType: row.service_type,
    coverage: row.coverage || [],
  };
}

export interface Review {
  buyer: string;
  country: string;
  rating: number;
  date: string;
  text: string;
}

export function mapReview(row: any): Review {
  return {
    buyer: row.buyer_name,
    country: row.buyer_country,
    rating: row.rating,
    date: row.date_label || formatMonthYear(row.created_at),
    text: row.body,
  };
}

export interface RFQ {
  id: string;
  buyerId: string;
  title: string;
  cat: string;
  qty: string;
  country: string;
  buyer: string;
  posted: string;
  deadline: string;
  quotes: number;
  status: string;
  desc: string;
}

export function mapRFQ(row: any): RFQ {
  return {
    id: row.id,
    buyerId: row.buyer_id,
    title: row.title,
    cat: row.category_id,
    qty: row.quantity_text,
    country: row.destination_country,
    buyer: row.buyer_name,
    posted: timeAgo(row.created_at),
    deadline: row.deadline ? formatDeadline(row.deadline) : "",
    quotes: row.quotes_count,
    status: row.status,
    desc: row.description,
  };
}

export interface Quote {
  id: string;
  rfqId: string;
  supplierId: string;
  priceUSD: number;
  leadTime: string;
  message: string | null;
  paymentTerms: string | null;
  incoterm: string | null;
  certs: string[];
  status: string;
  posted: string;
  supplier: {
    name: string;
    slug: string;
    rating: number | null;
    verified: boolean;
    country: string;
    tier: string;
  };
}

export function mapQuote(row: any): Quote {
  const sup = row.suppliers || {};
  return {
    id: row.id,
    rfqId: row.rfq_id,
    supplierId: row.supplier_id,
    priceUSD: row.price_usd,
    leadTime: row.lead_time_text,
    message: row.message,
    paymentTerms: row.payment_terms,
    incoterm: row.incoterm,
    certs: row.certs || [],
    status: row.status,
    posted: timeAgo(row.created_at),
    supplier: {
      name: sup.name,
      slug: sup.slug,
      rating: sup.rating != null ? parseFloat(sup.rating) : null,
      verified: sup.verified,
      country: sup.country_code,
      tier: sup.tier,
    },
  };
}

export interface Order {
  id: string;
  productName: string;
  supplierId: string | null;
  supplierName: string | null;
  supplierSlug: string | null;
  supplierPublicId: string | null;
  value: number;
  currency: string;
  status: string;
  date: string;
}

export function mapOrder(row: any): Order {
  const sup = row.suppliers || {};
  return {
    id: row.id,
    productName: row.product_name,
    supplierId: row.supplier_id || null,
    supplierName: sup.name || null,
    supplierSlug: sup.slug || null,
    supplierPublicId: sup.public_id || null,
    value: Number(row.value_usd),
    currency: row.currency,
    status: row.status,
    date: row.created_at ? row.created_at.slice(0, 10) : "",
  };
}

export function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 2) return "Just now";
  if (min < 60) return `${min} min ago`;
  if (hr < 24) return `${hr} hr${hr > 1 ? "s" : ""} ago`;
  if (day < 7) return `${day} day${day > 1 ? "s" : ""} ago`;
  return formatMonthYear(isoString);
}

export function formatDeadline(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatMonthYear(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
