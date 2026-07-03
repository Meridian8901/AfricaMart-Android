import { supabase } from "../lib/supabaseClient";
import { mapProduct, mapReview, mapSupplier, type Product, type Review, type Supplier } from "./mappers";

export async function getSupplierBySlug(slug: string): Promise<Supplier> {
  const { data, error } = await supabase.from("suppliers").select("*").eq("slug", slug).single();
  if (error) throw error;
  return mapSupplier(data);
}

export async function getProductsBySupplier(supplierId: string): Promise<Product[]> {
  const { data, error } = await supabase.from("products").select("*").eq("supplier_id", supplierId).eq("status", "active");
  if (error) throw error;
  return (data || []).map(mapProduct);
}

export async function getReviewsBySupplier(supplierId: string): Promise<Review[]> {
  const { data, error } = await supabase.from("reviews").select("*").eq("supplier_id", supplierId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapReview);
}

export function trackProfileView(supplierId?: string | null) {
  if (!supplierId) return;
  supabase.rpc("record_profile_view", { p_supplier_id: supplierId }).then(
    () => {},
    () => {}
  );
}

export interface SubmitReviewInput {
  supplierId: string;
  buyerName: string;
  buyerCountry?: string | null;
  rating: number;
  text: string;
}

export async function submitReview(input: SubmitReviewInput): Promise<Review> {
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      supplier_id: input.supplierId,
      buyer_name: input.buyerName,
      buyer_country: input.buyerCountry || null,
      rating: input.rating,
      body: input.text,
    })
    .select()
    .single();
  if (error) throw error;
  return mapReview(data);
}
