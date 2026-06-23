import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/HomeStack";
import { useAppDataStore } from "../../store/useAppDataStore";
import { searchProducts } from "../../services/catalog.service";
import { getStats } from "../../services/bootstrap.service";
import ProductCard from "../../components/ProductCard";
import { colors } from "../../theme";
import type { Product } from "../../services/mappers";

type Props = NativeStackScreenProps<HomeStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const { categories, load: loadAppData } = useAppDataStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<{ products: number; buyers: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadAll() {
    await loadAppData();
    const [{ products: featured }, statsResult] = await Promise.all([
      searchProducts({ sort: "inquired", pageSize: 12 }),
      getStats(),
    ]);
    setProducts(featured);
    setStats(statsResult);
  }

  useEffect(() => {
    loadAll().finally(() => setLoading(false));
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {stats && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.products.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.buyers.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Buyers</Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Categories</Text>
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.categoryChip}
            onPress={() =>
              (navigation.getParent() as any)?.navigate("BrowseTab", { screen: "Browse", params: { cat: item.id } })
            }
          >
            <Text style={styles.categoryText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.sectionTitle}>Popular products</Text>
      <FlatList
        data={products}
        numColumns={2}
        keyExtractor={(p) => p.id}
        scrollEnabled={false}
        contentContainerStyle={styles.productGrid}
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={() => navigation.navigate("ProductDetail", { slug: item.slug })} />
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  statsBar: { flexDirection: "row", justifyContent: "center", gap: 32, paddingVertical: 20 },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "700", color: colors.text },
  statLabel: { fontSize: 12, color: colors.muted },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: colors.text, marginHorizontal: 16, marginTop: 8, marginBottom: 10 },
  categoryList: { paddingHorizontal: 10, paddingBottom: 8 },
  categoryChip: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
  },
  categoryText: { color: colors.text, fontWeight: "600", fontSize: 13 },
  productGrid: { paddingHorizontal: 10, paddingBottom: 24 },
});
