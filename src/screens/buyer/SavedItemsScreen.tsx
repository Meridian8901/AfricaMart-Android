import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DashboardStackParamList } from "../../navigation/DashboardStack";
import { getSavedItems, getSavedProducts, getSavedSuppliers, unsaveItem } from "../../services/buyer.service";
import { useAuthStore } from "../../store/useAuthStore";
import ProductCard from "../../components/ProductCard";
import SupplierCard from "../../components/SupplierCard";
import type { Product, Supplier } from "../../services/mappers";
import { colors } from "../../theme";

type Props = NativeStackScreenProps<DashboardStackParamList, "SavedItems">;

export default function SavedItemsScreen({ navigation }: Props) {
  const buyerProfile = useAuthStore((s) => s.buyerProfile);
  const [mode, setMode] = useState<"product" | "supplier">("product");
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!buyerProfile) return;
    const saved = await getSavedItems(buyerProfile.id);
    const productIds = saved.filter((s) => s.item_type === "product").map((s) => s.item_id);
    const supplierIds = saved.filter((s) => s.item_type === "supplier").map((s) => s.item_id);
    const [p, s] = await Promise.all([getSavedProducts(productIds), getSavedSuppliers(supplierIds)]);
    setProducts(p);
    setSuppliers(s);
    setLoading(false);
  }, [buyerProfile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleUnsave(type: "product" | "supplier", id: string) {
    if (!buyerProfile) return;
    await unsaveItem(buyerProfile.id, type, id);
    load();
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.modeRow}>
        {(["product", "supplier"] as const).map((m) => (
          <TouchableOpacity key={m} style={[styles.modeButton, mode === m && styles.modeButtonActive]} onPress={() => setMode(m)}>
            <Text style={[styles.modeText, mode === m && styles.modeTextActive]}>{m === "product" ? "Products" : "Suppliers"}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode === "product" ? (
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No saved products.</Text>}
          renderItem={({ item }) => (
            <View>
              <ProductCard product={item} onPress={() => navigation.navigate("ProductDetail", { slug: item.slug })} />
              <TouchableOpacity style={styles.unsaveButton} onPress={() => handleUnsave("product", item.id)}>
                <Text style={styles.unsaveText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={suppliers}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No saved suppliers.</Text>}
          renderItem={({ item }) => (
            <View>
              <SupplierCard supplier={item} onPress={() => navigation.navigate("Storefront", { slug: item.slug })} />
              <TouchableOpacity style={styles.unsaveButton} onPress={() => handleUnsave("supplier", item.id)}>
                <Text style={styles.unsaveText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  modeRow: { flexDirection: "row", gap: 8, padding: 12 },
  modeButton: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, alignItems: "center" },
  modeButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  modeText: { color: colors.text, fontWeight: "600" },
  modeTextActive: { color: "#fff" },
  list: { paddingHorizontal: 8, paddingBottom: 24 },
  empty: { textAlign: "center", color: colors.muted, marginTop: 40 },
  unsaveButton: { alignSelf: "center", marginBottom: 12, marginTop: -4 },
  unsaveText: { color: colors.danger, fontSize: 11, fontWeight: "700" },
});
