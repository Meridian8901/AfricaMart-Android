import { supabase } from "../lib/supabaseClient";
import { mapCategory, mapCountry, mapCurrency, type Category, type Country, type Currency } from "./mappers";

export async function getCountries(): Promise<Country[]> {
  const { data, error } = await supabase.from("countries").select("*").order("name");
  if (error) throw error;
  return (data || []).map(mapCountry);
}

export async function getCurrencies(): Promise<Record<string, Currency>> {
  const { data, error } = await supabase.from("currencies").select("*");
  if (error) throw error;
  return Object.fromEntries((data || []).map((r: any) => [r.code, mapCurrency(r)]));
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) throw error;
  return (data || []).map(mapCategory);
}

export async function getStats(): Promise<{ products: number; buyers: number }> {
  const [productsRes, statsRes] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.rpc("get_public_stats"),
  ]);
  if (productsRes.error) throw productsRes.error;
  if (statsRes.error) throw statsRes.error;
  const buyers = statsRes.data && statsRes.data[0] ? Number(statsRes.data[0].buyers_count) : 0;
  return { products: productsRes.count || 0, buyers };
}
