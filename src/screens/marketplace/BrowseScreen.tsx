import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BrowseStackParamList } from "../../navigation/BrowseStack";
import { browseSuppliers, searchProducts } from "../../services/catalog.service";
import { useAppDataStore } from "../../store/useAppDataStore";
import ProductCard from "../../components/ProductCard";
import SupplierCard from "../../components/SupplierCard";
import { colors } from "../../theme";
import type { Product, Supplier } from "../../services/mappers";

type Props = NativeStackScreenProps<BrowseStackParamList, "Browse">;

const PAGE_SIZE = 20;

export default function BrowseScreen({ navigation, route }: Props) {
  const { categories } = useAppDataStore();
  const [mode, setMode] = useState<"products" | "suppliers">("products");
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string | undefined>(route.params?.cat);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  async function load(targetPage = 1) {
    setLoading(true);
    try {
      if (mode === "products") {
        const { products: rows, total: t } = await searchProducts({ q: query, cat: activeCat, page: targetPage, pageSize: PAGE_SIZE });
        setProducts(targetPage === 1 ? rows : [...products, ...rows]);
        setTotal(t);
      } else {
        const { suppliers: rows, total: t } = await browseSuppliers({ q: query, cat: activeCat, page: targetPage, pageSize: PAGE_SIZE });
        setSuppliers(targetPage === 1 ? rows : [...suppliers, ...rows]);
        setTotal(t);
      }
      setPage(targetPage);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
  }, [mode, activeCat]);

  const items = mode === "products" ? products : suppliers;
  const canLoadMore = items.length < total;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search products or suppliers"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => load(1)}
        returnKeyType="search"
      />

      <View style={styles.modeRow}>
        {(["products", "suppliers"] as const).map((m) => (
          <TouchableOpacity key={m} style={[styles.modeButton, mode === m && styles.modeButtonActive]} onPress={() => setMode(m)}>
            <Text style={[styles.modeText, mode === m && styles.modeTextActive]}>{m === "products" ? "Products" : "Suppliers"}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.categoryList}
        style={styles.categoryListWrap}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryChip, activeCat === item.id && styles.categoryChipActive]}
            onPress={() => setActiveCat(activeCat === item.id ? undefined : item.id)}
          >
            <Text style={[styles.categoryText, activeCat === item.id && styles.categoryTextActive]}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      {mode === "products" ? (
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ProductCard product={item} onPress={() => navigation.navigate("ProductDetail", { slug: item.slug })} />
          )}
          onEndReached={() => canLoadMore && !loading && load(page + 1)}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loading ? <ActivityIndicator style={styles.footerLoader} color={colors.primary} /> : null}
        />
      ) : (
        <FlatList
          data={suppliers}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <SupplierCard supplier={item} onPress={() => navigation.navigate("Storefront", { slug: item.slug })} />
          )}
          onEndReached={() => canLoadMore && !loading && load(page + 1)}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loading ? <ActivityIndicator style={styles.footerLoader} color={colors.primary} /> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  search: {
    margin: 12,
    marginBottom: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
  },
  modeRow: { flexDirection: "row", paddingHorizontal: 12, gap: 8, marginBottom: 8 },
  modeButton: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, alignItems: "center" },
  modeButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  modeText: { color: colors.text, fontWeight: "600" },
  modeTextActive: { color: "#fff" },
  categoryListWrap: { maxHeight: 44, marginBottom: 4 },
  categoryList: { paddingHorizontal: 8 },
  categoryChip: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 14, marginHorizontal: 4 },
  categoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryText: { color: colors.text, fontSize: 12, fontWeight: "600" },
  categoryTextActive: { color: "#fff" },
  list: { paddingHorizontal: 8, paddingBottom: 24 },
  footerLoader: { marginVertical: 16 },
});
