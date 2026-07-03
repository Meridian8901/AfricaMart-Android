import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DashboardStackParamList } from "../../navigation/DashboardStack";
import { deactivateProduct, getMyProducts } from "../../services/supplier.service";
import { useAuthStore } from "../../store/useAuthStore";
import type { Product } from "../../services/mappers";
import { colors } from "../../theme";

type Props = NativeStackScreenProps<DashboardStackParamList, "SupplierProducts">;

export default function SupplierProductsScreen({ navigation }: Props) {
  const supplierProfile = useAuthStore((s) => s.supplierProfile);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!supplierProfile) return;
    const rows = await getMyProducts(supplierProfile.id);
    setProducts(rows);
    setLoading(false);
  }, [supplierProfile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleDeactivate(product: Product) {
    Alert.alert("Remove product", `Take "${product.name}" off the live catalog?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await deactivateProduct(product.id);
          load();
        },
      },
    ]);
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
      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("SupplierProductEdit", {})}>
        <Text style={styles.addButtonText}>+ Add product</Text>
      </TouchableOpacity>

      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>You haven&apos;t listed any products yet.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("SupplierProductEdit", { productId: item.id })}>
            <View style={styles.cardHeader}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.status, item.status !== "active" && styles.statusInactive]}>{item.status}</Text>
            </View>
            <Text style={styles.meta}>
              ${item.priceUSD.toFixed(2)} / {item.unit} · MOQ {item.moq} {item.moqUnit}
            </Text>
            <Text style={styles.meta}>
              {item.inquiries} inquiries · {item.views} views
            </Text>
            {item.status === "active" && (
              <TouchableOpacity style={styles.removeButton} onPress={() => handleDeactivate(item)}>
                <Text style={styles.removeText}>Remove from catalog</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  addButton: { backgroundColor: colors.primary, margin: 12, borderRadius: 10, padding: 14, alignItems: "center" },
  addButtonText: { color: "#fff", fontWeight: "700" },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  empty: { textAlign: "center", color: colors.muted, marginTop: 40 },
  card: { backgroundColor: colors.card, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 15, fontWeight: "700", color: colors.text, flex: 1, marginRight: 8 },
  status: { fontSize: 11, color: colors.primary, fontWeight: "700", textTransform: "uppercase" },
  statusInactive: { color: colors.muted },
  meta: { fontSize: 12, color: colors.muted, marginTop: 4 },
  removeButton: { marginTop: 10 },
  removeText: { color: colors.danger, fontSize: 12, fontWeight: "700" },
});
