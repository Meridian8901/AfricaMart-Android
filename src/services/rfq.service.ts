import { supabase } from "../lib/supabaseClient";
import { API_BASE_URL } from "../config/env";
import { mapQuote, mapRFQ, type Quote, type RFQ } from "./mappers";

export interface SubmitRFQInput {
  title: string;
  category_id?: string | null;
  quantity_text?: string | null;
  destination_country?: string | null;
  buyer_id: string;
  buyer_name: string;
  deadline?: string | null;
  description?: string | null;
  turnstileToken: string;
}

export async function submitRFQ(rfqData: SubmitRFQInput, accessToken: string): Promise<RFQ> {
  const res = await fetch(`${API_BASE_URL}/api/rfq-submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(rfqData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not post RFQ");
  return data.rfq;
}

export async function getOpenRFQs(categoryId?: string): Promise<RFQ[]> {
  let query = supabase.from("rfqs").select("*").eq("status", "open").order("created_at", { ascending: false });
  if (categoryId) query = query.eq("category_id", categoryId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapRFQ);
}

export async function getRFQById(rfqId: string): Promise<RFQ | null> {
  const { data, error } = await supabase.from("rfqs").select("*").eq("id", rfqId).maybeSingle();
  if (error) throw error;
  return data ? mapRFQ(data) : null;
}

export async function getQuotesForRFQ(rfqId: string): Promise<Quote[]> {
  const { data, error } = await supabase
    .from("rfq_quotes")
    .select("*, suppliers(name, slug, rating, verified, country_code, tier)")
    .eq("rfq_id", rfqId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapQuote);
}

export async function acceptQuote(rfqId: string, quoteId: string) {
  const { error: e1 } = await supabase.from("rfq_quotes").update({ status: "accepted" }).eq("id", quoteId);
  if (e1) throw e1;
  const { error: e2 } = await supabase
    .from("rfq_quotes")
    .update({ status: "declined" })
    .eq("rfq_id", rfqId)
    .eq("status", "pending")
    .neq("id", quoteId);
  if (e2) throw e2;
  const { error: e3 } = await supabase.from("rfqs").update({ status: "awarded" }).eq("id", rfqId);
  if (e3) throw e3;

  const [{ data: rfqRow, error: e4 }, { data: quoteRow, error: e5 }, { data: orderId, error: e6 }] = await Promise.all([
    supabase.from("rfqs").select("buyer_id, title, destination_country").eq("id", rfqId).single(),
    supabase.from("rfq_quotes").select("supplier_id, price_usd").eq("id", quoteId).single(),
    supabase.rpc("generate_order_id"),
  ]);
  if (e4) throw e4;
  if (e5) throw e5;
  if (e6) throw e6;

  const { error: e7 } = await supabase.from("orders").insert({
    id: orderId,
    buyer_id: rfqRow!.buyer_id,
    supplier_id: quoteRow!.supplier_id,
    product_id: null,
    product_name: rfqRow!.title,
    value_usd: quoteRow!.price_usd,
    commission_usd: 0,
    status: "processing",
    destination_country: rfqRow!.destination_country,
  });
  if (e7) throw e7;
}

export interface SubmitQuoteFields {
  priceUSD: number;
  leadTime: string;
  message?: string;
  paymentTerms?: string;
  incoterm?: string;
  certs?: string[];
}

export async function submitQuote(rfqId: string, supplierId: string, fields: SubmitQuoteFields): Promise<Quote> {
  const { data, error } = await supabase
    .from("rfq_quotes")
    .upsert(
      {
        rfq_id: rfqId,
        supplier_id: supplierId,
        price_usd: fields.priceUSD,
        lead_time_text: fields.leadTime,
        message: fields.message || null,
        payment_terms: fields.paymentTerms || null,
        incoterm: fields.incoterm || null,
        certs: fields.certs || [],
      },
      { onConflict: "rfq_id,supplier_id" }
    )
    .select("*, suppliers(name, slug, rating, verified, country_code, tier)")
    .single();
  if (error) throw error;
  return mapQuote(data);
}

export async function declineQuote(quoteId: string) {
  const { error } = await supabase.from("rfq_quotes").update({ status: "declined" }).eq("id", quoteId);
  if (error) throw error;
}

export async function getMatchedRFQs(supplierId: string, limit = 5): Promise<(RFQ & { score: number })[]> {
  const { data, error } = await supabase
    .from("rfq_matches")
    .select("score, rfqs!inner(*)")
    .eq("supplier_id", supplierId)
    .eq("rfqs.status", "open")
    .order("score", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map((row: any) => ({ ...mapRFQ(row.rfqs), score: row.score }));
}
