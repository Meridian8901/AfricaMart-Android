import { supabase } from "../lib/supabaseClient";
import { mapOrder, mapProduct, mapRFQ, mapSupplier, type Order, type Product, type RFQ, type Supplier } from "./mappers";

export type SavedItemType = "product" | "supplier";

export async function getBuyerRFQs(buyerId: string): Promise<RFQ[]> {
  const { data, error } = await supabase.from("rfqs").select("*").eq("buyer_id", buyerId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRFQ);
}

export async function getBuyerOrders(buyerId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, suppliers(name, slug, public_id)")
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapOrder);
}

export async function getSavedItems(buyerId: string): Promise<{ item_type: SavedItemType; item_id: string }[]> {
  const { data, error } = await supabase.from("saved_items").select("item_type, item_id").eq("buyer_id", buyerId);
  if (error) throw error;
  return data || [];
}

export async function saveItem(buyerId: string, itemType: SavedItemType, itemId: string) {
  const { error } = await supabase
    .from("saved_items")
    .upsert({ buyer_id: buyerId, item_type: itemType, item_id: itemId }, { onConflict: "buyer_id,item_type,item_id" });
  if (error) throw error;
}

export async function unsaveItem(buyerId: string, itemType: SavedItemType, itemId: string) {
  const { error } = await supabase.from("saved_items").delete().eq("buyer_id", buyerId).eq("item_type", itemType).eq("item_id", itemId);
  if (error) throw error;
}

export async function getSavedProducts(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("products").select("*").in("id", ids).eq("status", "active");
  if (error) throw error;
  return (data || []).map(mapProduct);
}

export async function getSavedSuppliers(ids: string[]): Promise<Supplier[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("suppliers").select("*").in("id", ids);
  if (error) throw error;
  return (data || []).map(mapSupplier);
}

export interface BuyerSettingsFields {
  name?: string;
  phone?: string;
  countryCode?: string;
  emailNotifications?: boolean;
  addressLine?: string;
  deliveryCountryCode?: string;
}

export async function getBuyerSettings(profileId: string, buyerId: string) {
  const [profileRes, buyerRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", profileId).maybeSingle(),
    supabase.from("buyers").select("*").eq("id", buyerId).maybeSingle(),
  ]);
  if (profileRes.error) throw profileRes.error;
  if (buyerRes.error) throw buyerRes.error;
  return { profile: profileRes.data, entity: buyerRes.data };
}

export async function saveBuyerSettings(profileId: string, buyerId: string, fields: BuyerSettingsFields) {
  const [profileRes, buyerRes] = await Promise.all([
    supabase
      .from("profiles")
      .update({ phone: fields.phone, country_code: fields.countryCode, email_notifications: fields.emailNotifications })
      .eq("id", profileId),
    supabase
      .from("buyers")
      .update({
        name: fields.name,
        country_code: fields.countryCode,
        address_line: fields.addressLine,
        delivery_country_code: fields.deliveryCountryCode,
      })
      .eq("id", buyerId),
  ]);
  if (profileRes.error) throw profileRes.error;
  if (buyerRes.error) throw buyerRes.error;
}
