import { supabase } from "../lib/supabaseClient";
import { mapProduct, mapSupplier, timeAgo, type Product, type Supplier } from "./mappers";

function slugify(str: string): string {
  return (str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export interface ProductFields {
  category?: string | null;
  name: string;
  sku?: string;
  price?: string | number;
  unit?: string;
  moq?: string | number;
  desc?: string;
  tags?: string[];
  priceTiers?: unknown[];
  specs?: unknown[];
  certs?: string[];
  originCountry?: string;
}

export async function getProductById(productId: string): Promise<Product | null> {
  const { data, error } = await supabase.from("products").select("*").eq("id", productId).maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data) : null;
}

export async function getMyProducts(supplierId: string): Promise<Product[]> {
  const { data, error } = await supabase.from("products").select("*").eq("supplier_id", supplierId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapProduct);
}

export async function createProduct(supplierId: string, fields: ProductFields): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .insert({
      slug: `${slugify(fields.name)}-${Date.now().toString(36)}`,
      supplier_id: supplierId,
      category_id: fields.category || null,
      name: fields.name,
      sku: fields.sku || null,
      price_usd: fields.price !== "" && fields.price != null ? Number(fields.price) : null,
      unit: fields.unit || null,
      moq: fields.moq !== "" && fields.moq != null ? Number(fields.moq) : null,
      moq_unit: fields.unit || null,
      description: fields.desc || null,
      tags: fields.tags || [],
      price_tiers: fields.priceTiers || [],
      specs: fields.specs || [],
      certs: fields.certs || [],
      origin_country: fields.originCountry || null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapProduct(data);
}

export async function updateProduct(productId: string, fields: ProductFields): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .update({
      category_id: fields.category || null,
      name: fields.name,
      sku: fields.sku || null,
      price_usd: fields.price !== "" && fields.price != null ? Number(fields.price) : null,
      unit: fields.unit || null,
      moq: fields.moq !== "" && fields.moq != null ? Number(fields.moq) : null,
      moq_unit: fields.unit || null,
      description: fields.desc || null,
      tags: fields.tags || [],
      price_tiers: fields.priceTiers || [],
      specs: fields.specs || [],
      certs: fields.certs || [],
      origin_country: fields.originCountry || null,
    })
    .eq("id", productId)
    .select()
    .single();
  if (error) throw error;
  return mapProduct(data);
}

export async function deactivateProduct(productId: string) {
  const { error } = await supabase.from("products").update({ status: "inactive" }).eq("id", productId);
  if (error) throw error;
}

export async function getSupplierProfile(supplierId: string): Promise<Supplier | null> {
  const { data, error } = await supabase.from("suppliers").select("*").eq("id", supplierId).maybeSingle();
  if (error) throw error;
  return data ? mapSupplier(data) : null;
}

export interface SupplierStoreFields {
  bio?: string;
  certs?: string[];
  capabilities?: Record<string, unknown>;
  color?: string;
  tags?: string[];
  since?: string | number;
  websiteUrl?: string;
  businessHours?: string;
}

export async function saveSupplierStore(supplierId: string, fields: SupplierStoreFields) {
  const { error } = await supabase
    .from("suppliers")
    .update({
      bio: fields.bio,
      certs: fields.certs,
      capabilities: fields.capabilities,
      color: fields.color,
      tags: fields.tags,
      since: fields.since !== "" && fields.since != null ? Number(fields.since) : null,
      website_url: fields.websiteUrl || null,
      business_hours: fields.businessHours || null,
    })
    .eq("id", supplierId);
  if (error) throw error;
}

async function uriToBlob(uri: string): Promise<Blob> {
  const res = await fetch(uri);
  return res.blob();
}

function extFromName(name: string, fallback: string): string {
  return name.includes(".") ? name.slice(name.lastIndexOf(".")) : fallback;
}

export type SupplierMediaKind = "logo" | "banner" | "about";

const SUPPLIER_MEDIA_COLUMN: Record<SupplierMediaKind, string> = {
  logo: "logo_url",
  banner: "banner_url",
  about: "about_image_url",
};

export async function uploadSupplierMedia(
  supplierId: string,
  kind: SupplierMediaKind,
  asset: { uri: string; fileName?: string | null; mimeType?: string | null }
) {
  const blob = await uriToBlob(asset.uri);
  const ext = extFromName(asset.fileName ?? "", ".jpg");
  const path = `${supplierId}/${kind}${ext}`;
  const { error: uploadError } = await supabase.storage.from("supplier-media").upload(path, blob, {
    upsert: true,
    contentType: asset.mimeType ?? "image/jpeg",
  });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from("supplier-media").getPublicUrl(path);
  const url = `${data.publicUrl}?t=${Date.now()}`;
  const { error: updateError } = await supabase.from("suppliers").update({ [SUPPLIER_MEDIA_COLUMN[kind]]: url }).eq("id", supplierId);
  if (updateError) throw updateError;
  return url;
}

export async function uploadProductImage(supplierId: string, productId: string, asset: { uri: string; fileName?: string | null; mimeType?: string | null }) {
  const blob = await uriToBlob(asset.uri);
  const ext = extFromName(asset.fileName ?? "", ".jpg");
  const path = `${supplierId}/${productId}-${Date.now()}${ext}`;
  const { error: uploadError } = await supabase.storage.from("product-images").upload(path, blob, {
    upsert: true,
    contentType: asset.mimeType ?? "image/jpeg",
  });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  const url = `${data.publicUrl}?t=${Date.now()}`;
  const { error: updateError } = await supabase.from("products").update({ image_url: url }).eq("id", productId);
  if (updateError) throw updateError;
  return url;
}

export interface ProductAttachment {
  url: string;
  type: "image" | "pdf";
  name: string;
}

export async function uploadProductFile(
  supplierId: string,
  productId: string,
  asset: { uri: string; fileName?: string | null; mimeType?: string | null }
): Promise<ProductAttachment> {
  const mimeType = asset.mimeType ?? "application/octet-stream";
  const isImage = mimeType.startsWith("image/");
  const fileName = asset.fileName ?? (isImage ? "photo.jpg" : "document.pdf");
  const ext = extFromName(fileName, isImage ? ".jpg" : ".pdf").replace(".", "");
  const blob = await uriToBlob(asset.uri);
  const path = `${supplierId}/${productId}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, blob, { upsert: true, contentType: mimeType });
  if (error) throw error;
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return { url: data.publicUrl, type: isImage ? "image" : "pdf", name: fileName };
}

export async function updateProductMedia(productId: string, attachments: ProductAttachment[], imageUrl: string | null): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .update({ attachments, image_url: imageUrl || null })
    .eq("id", productId)
    .select()
    .single();
  if (error) throw error;
  return mapProduct(data);
}

export interface Inquiry {
  id: string;
  who: string;
  country?: string;
  subj: string;
  status: "New" | "Replied" | "Closed";
  last: string;
  time: string;
  firstMessage: string;
  firstSentAt: string;
  requestType: string;
}

function mapInquiry(row: any): Inquiry {
  return {
    id: row.id,
    who: row.buyer_company || row.buyer_name || "Anonymous buyer",
    country: row.buyers ? row.buyers.country_code : undefined,
    subj: (row.products?.name ?? "General inquiry") + (row.quantity ? ` — ${row.quantity}` : ""),
    status: row.status === "pending" ? "New" : row.status === "responded" ? "Replied" : "Closed",
    last: row.message,
    time: timeAgo(row.created_at),
    firstMessage: row.message,
    firstSentAt: row.created_at,
    requestType: row.request_type,
  };
}

export async function getSupplierInquiries(supplierId: string): Promise<Inquiry[]> {
  const { data, error } = await supabase
    .from("inquiries")
    .select("*, products(name), buyers(country_code)")
    .eq("supplier_id", supplierId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapInquiry);
}

export interface InquiryMessage {
  id: string;
  senderRole: "buyer" | "supplier";
  body: string;
  time: string;
}

function mapInquiryMessage(row: any): InquiryMessage {
  return { id: row.id, senderRole: row.sender_role, body: row.body, time: timeAgo(row.created_at) };
}

export async function getInquiryMessages(inquiryId: string): Promise<InquiryMessage[]> {
  const { data, error } = await supabase.from("inquiry_messages").select("*").eq("inquiry_id", inquiryId).order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(mapInquiryMessage);
}

export async function sendInquiryMessage(inquiryId: string, senderRole: "buyer" | "supplier", body: string): Promise<InquiryMessage> {
  const { data, error } = await supabase.from("inquiry_messages").insert({ inquiry_id: inquiryId, sender_role: senderRole, body }).select().single();
  if (error) throw error;
  return mapInquiryMessage(data);
}

export interface VerificationRow {
  id: string;
  status: string;
  docs: string[];
  reviewer_notes?: string | null;
}

export async function getSupplierVerification(supplierId: string): Promise<VerificationRow | null> {
  const { data, error } = await supabase.from("verification_queue").select("*").eq("supplier_id", supplierId).eq("kind", "supplier").maybeSingle();
  if (error) throw error;
  return data;
}

export async function uploadKycDoc(supplierId: string, docLabel: string, asset: { uri: string; fileName?: string | null; mimeType?: string | null }) {
  const blob = await uriToBlob(asset.uri);
  const ext = extFromName(asset.fileName ?? "", ".pdf");
  const path = `${supplierId}/${docLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}${ext}`;
  const { error } = await supabase.storage.from("kyc-docs").upload(path, blob, {
    upsert: true,
    contentType: asset.mimeType ?? "application/octet-stream",
  });
  if (error) throw error;
  return path;
}

export async function getKycDocUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from("kyc-docs").createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export async function submitVerification(docPaths: string[]) {
  const { data, error } = await supabase.rpc("submit_supplier_verification", { p_docs: docPaths });
  if (error) throw error;
  return data;
}

export interface SupplierAnalytics {
  profileViews: number;
  productViews: number;
  inquiriesTotal: number;
  responseRate: number;
  conversion: number;
  deltas: { profileViews: number | null; productViews: number | null; inquiriesLast7: number };
  chart: number[];
}

export async function getAnalytics(supplierId: string): Promise<SupplierAnalytics> {
  const { data: supplier, error: e1 } = await supabase.from("suppliers").select("profile_views, response_rate").eq("id", supplierId).maybeSingle();
  if (e1) throw e1;

  const { data: products, error: e2 } = await supabase.from("products").select("views_count").eq("supplier_id", supplierId);
  if (e2) throw e2;

  const { count: inquiriesTotal, error: e3 } = await supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("supplier_id", supplierId);
  if (e3) throw e3;

  const now = new Date();
  const since = new Date(now);
  since.setDate(now.getDate() - 29);
  const { data: daily, error: e4 } = await supabase
    .from("supplier_analytics_daily")
    .select("day, profile_views, product_views")
    .eq("supplier_id", supplierId)
    .gte("day", since.toISOString().slice(0, 10))
    .order("day", { ascending: true });
  if (e4) throw e4;

  const last7 = new Date(now);
  last7.setDate(now.getDate() - 7);
  const { count: inquiriesLast7, error: e5 } = await supabase
    .from("inquiries")
    .select("id", { count: "exact", head: true })
    .eq("supplier_id", supplierId)
    .gte("created_at", last7.toISOString());
  if (e5) throw e5;

  const prev7 = new Date(now);
  prev7.setDate(now.getDate() - 14);
  const { count: inquiriesPrev7, error: e6 } = await supabase
    .from("inquiries")
    .select("id", { count: "exact", head: true })
    .eq("supplier_id", supplierId)
    .gte("created_at", prev7.toISOString())
    .lt("created_at", last7.toISOString());
  if (e6) throw e6;
  void inquiriesPrev7;

  const profileViews = supplier?.profile_views || 0;
  const productViews = (products || []).reduce((sum: number, p: any) => sum + (p.views_count || 0), 0);
  const responseRate = supplier?.response_rate || 0;
  const conversion = profileViews > 0 ? ((inquiriesTotal || 0) / profileViews) * 100 : 0;

  const byDay: Record<string, any> = {};
  (daily || []).forEach((r: any) => {
    byDay[r.day] = r;
  });
  const profileSeries: number[] = [];
  const productSeries: number[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const row = byDay[d.toISOString().slice(0, 10)];
    profileSeries.push(row?.profile_views || 0);
    productSeries.push(row?.product_views || 0);
  }

  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const pctDelta = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : null;
    return Math.round(((curr - prev) / prev) * 100);
  };

  return {
    profileViews,
    productViews,
    inquiriesTotal: inquiriesTotal || 0,
    responseRate,
    conversion,
    deltas: {
      profileViews: pctDelta(sum(profileSeries.slice(23)), sum(profileSeries.slice(16, 23))),
      productViews: pctDelta(sum(productSeries.slice(23)), sum(productSeries.slice(16, 23))),
      inquiriesLast7: inquiriesLast7 || 0,
    },
    chart: profileSeries.map((v, i) => v + productSeries[i]),
  };
}

export interface SupplierSettingsFields {
  name?: string;
  type?: string;
  phone?: string;
  countryCode?: string;
  emailNotifications?: boolean;
  defaultCurrency?: string;
  slug?: string;
}

export async function getSupplierSettings(profileId: string, supplierId: string) {
  const [profileRes, supplierRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", profileId).maybeSingle(),
    supabase.from("suppliers").select("*").eq("id", supplierId).maybeSingle(),
  ]);
  if (profileRes.error) throw profileRes.error;
  if (supplierRes.error) throw supplierRes.error;
  return { profile: profileRes.data, entity: supplierRes.data };
}

export async function saveSupplierSettings(profileId: string, supplierId: string, fields: SupplierSettingsFields) {
  const [profileRes, supplierRes] = await Promise.all([
    supabase.from("profiles").update({ phone: fields.phone, country_code: fields.countryCode, email_notifications: fields.emailNotifications }).eq("id", profileId),
    supabase
      .from("suppliers")
      .update({
        name: fields.name,
        type: fields.type,
        country_code: fields.countryCode,
        phone: fields.phone,
        default_currency: fields.defaultCurrency,
        ...(fields.slug ? { slug: fields.slug } : {}),
      })
      .eq("id", supplierId),
  ]);
  if (profileRes.error) throw profileRes.error;
  if (supplierRes.error) throw supplierRes.error;
}
