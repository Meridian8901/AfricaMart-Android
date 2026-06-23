import { supabase } from "../lib/supabaseClient";
import { API_BASE_URL } from "../config/env";
import type { Product, Supplier } from "./mappers";

export interface SearchProductsOptions {
  q?: string;
  cat?: string;
  country?: string;
  verifiedOnly?: boolean;
  maxPrice?: number;
  maxMoq?: number;
  sort?: "inquired" | "rating" | "views";
  page?: number;
  pageSize?: number;
}

function mapSearchProductRow(r: any): Product {
  return {
    id: r.id,
    slug: r.slug,
    publicId: r.public_id,
    supplier: r.supplier_id,
    cat: r.category_id,
    name: r.name,
    sku: r.sku,
    priceUSD: parseFloat(r.price_usd) || 0,
    unit: r.unit,
    moq: parseFloat(r.moq) || 0,
    moqUnit: r.moq_unit,
    tags: r.tags || [],
    inquiries: r.inquiry_count || 0,
    views: r.views_count || 0,
    status: "active",
    desc: r.description,
    specs: Array.isArray(r.specs) ? r.specs : [],
    certs: r.certs || [],
    priceTiers: Array.isArray(r.price_tiers) ? r.price_tiers : [],
    image: r.image_url || null,
    attachments: Array.isArray(r.attachments) ? r.attachments : [],
    originCountry: r.origin_country || null,
  };
}

export async function searchProducts(
  opts: SearchProductsOptions = {}
): Promise<{ products: Product[]; total: number }> {
  const { q: searchText = "", cat = "", country = "", verifiedOnly = false, maxPrice = 0, maxMoq = 0, sort = "inquired", page = 1, pageSize = 24 } = opts;

  const { data, error } = await supabase.rpc("search_products", {
    search_text: searchText || null,
    p_category_id: cat || null,
    p_country_code: country || null,
    p_verified_only: verifiedOnly,
    p_max_price: maxPrice > 0 ? maxPrice : null,
    p_max_moq: maxMoq > 0 ? maxMoq : null,
    p_sort_by: sort,
    p_page: page,
    p_page_size: pageSize,
  });
  if (error) throw error;

  const total = data && data.length > 0 ? Number(data[0].total_count) : 0;
  return { products: (data || []).map(mapSearchProductRow), total };
}

export interface BrowseSuppliersOptions {
  q?: string;
  cat?: string;
  country?: string;
  kind?: "product" | "service" | "";
  page?: number;
  pageSize?: number;
}

function mapSearchSupplierRow(r: any): Supplier {
  return {
    id: r.id,
    slug: r.slug,
    publicId: r.public_id,
    name: r.name,
    country: r.country_code,
    phone: r.phone,
    cat: r.category_id,
    kind: r.kind,
    tier: r.tier,
    verified: r.verified,
    rating: parseFloat(r.rating) || 0,
    reviews: r.review_count || 0,
    responseRate: r.response_rate || 0,
    responseTime: r.response_time,
    since: r.since,
    products: r.products_count || 0,
    bio: r.bio,
    type: r.type,
    color: r.color || "#5a6b7a",
    tags: r.tags || [],
    certs: r.certs || [],
    capabilities: {},
    status: "active",
    logoUrl: null,
    bannerUrl: null,
    aboutImageUrl: null,
    websiteUrl: null,
    businessHours: null,
    serviceType: r.service_type,
    coverage: r.coverage || [],
  };
}

export async function browseSuppliers(
  opts: BrowseSuppliersOptions = {}
): Promise<{ suppliers: Supplier[]; total: number }> {
  const { q: searchText = "", cat = "", country = "", kind = "", page = 1, pageSize = 24 } = opts;

  const { data, error } = await supabase.rpc("search_suppliers", {
    search_text: searchText || null,
    p_category_id: cat || null,
    p_country_code: country || null,
    p_kind: kind || null,
    p_page: page,
    p_page_size: pageSize,
  });
  if (error) throw error;

  const total = data && data.length > 0 ? Number(data[0].total_count) : 0;
  return { suppliers: (data || []).map(mapSearchSupplierRow), total };
}

function mapProductRow(row: any): Product {
  return {
    id: row.id,
    slug: row.slug,
    publicId: row.public_id,
    supplier: row.supplier_id,
    cat: row.category_id,
    name: row.name,
    sku: row.sku,
    priceUSD: parseFloat(row.price_usd) || 0,
    unit: row.unit,
    moq: parseFloat(row.moq) || 0,
    moqUnit: row.moq_unit,
    tags: row.tags || [],
    inquiries: row.inquiry_count || 0,
    views: row.views_count || 0,
    status: row.status,
    desc: row.description,
    specs: Array.isArray(row.specs) ? row.specs : JSON.parse(row.specs || "[]"),
    certs: row.certs || [],
    priceTiers: Array.isArray(row.price_tiers) ? row.price_tiers : [],
    image: row.image_url || null,
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
    originCountry: row.origin_country || null,
  };
}

function mapSupplierSummaryRow(sRow: any) {
  return {
    id: sRow.id,
    slug: sRow.slug,
    publicId: sRow.public_id,
    name: sRow.name,
    country: sRow.country_code,
    phone: sRow.phone,
    cat: sRow.category_id,
    kind: sRow.kind,
    tier: sRow.tier,
    verified: sRow.verified,
    rating: parseFloat(sRow.rating) || 0,
    reviews: sRow.review_count || 0,
    color: sRow.color || "#5a6b7a",
  };
}

export async function getProductBySlug(slug: string): Promise<{ product: Product; supplier: ReturnType<typeof mapSupplierSummaryRow> | null } | null> {
  const { data: row, error } = await supabase.from("products").select("*").eq("slug", slug).eq("status", "active").maybeSingle();
  if (error) throw error;
  if (!row) return null;

  const product = mapProductRow(row);

  const { data: sRow, error: sError } = await supabase.from("suppliers").select("*").eq("id", row.supplier_id).maybeSingle();
  if (sError) throw sError;

  return { product, supplier: sRow ? mapSupplierSummaryRow(sRow) : null };
}

export async function getProductByPublicId(publicId: string) {
  const { data: row, error } = await supabase.from("products").select("slug").eq("public_id", publicId).eq("status", "active").maybeSingle();
  if (error) throw error;
  if (!row) return null;
  return getProductBySlug(row.slug);
}

export function trackProductView(productId?: string | null) {
  if (!productId) return;
  supabase.rpc("record_product_view", { p_product_id: productId }).then(
    () => {},
    () => {}
  );
}

export interface SubmitInquiryInput {
  product_id?: string | null;
  supplier_id: string;
  buyer_id?: string | null;
  buyer_name: string;
  buyer_email: string;
  buyer_company?: string | null;
  message: string;
  quantity?: string | null;
  request_type: "inquiry" | "sample";
  turnstileToken: string;
}

export async function submitInquiry(inquiry: SubmitInquiryInput) {
  const res = await fetch(`${API_BASE_URL}/api/inquiry-submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(inquiry),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not send inquiry");
  return data;
}
