import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/HomeStack";
import { getProductBySlug, trackProductView } from "../../services/catalog.service";
import { colors } from "../../theme";

type Props = NativeStackScreenProps<HomeStackParamList, "ProductDetail">;

export default function ProductDetailScreen({ navigation, route }: Props) {
  const { slug } = route.params;
  const [data, setData] = useState<Awaited<ReturnType<typeof getProductBySlug>>>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProductBySlug(slug)
      .then((result) => {
        setData(result);
        if (result) trackProductView(result.product.id);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.loading}>
        <Text style={styles.notFound}>Product not found.</Text>
      </View>
    );
  }

  const { product, supplier } = data;

  return (
    <ScrollView style={styles.container}>
      {product.image ? (
        <Image source={{ uri: product.image }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={styles.imagePlaceholderText}>{product.name[0]}</Text>
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>
          ${product.priceUSD.toFixed(2)} / {product.unit}
        </Text>
        <Text style={styles.moq}>
          MOQ: {product.moq} {product.moqUnit}
        </Text>

        {supplier && (
          <TouchableOpacity style={styles.supplierRow} onPress={() => navigation.navigate("Storefront", { slug: supplier.slug })}>
            <Text style={styles.supplierName}>{supplier.name}</Text>
            <Text style={styles.supplierMeta}>⭐ {supplier.rating.toFixed(1)} ({supplier.reviews})</Text>
          </TouchableOpacity>
        )}

        {product.desc && (
          <>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.desc}>{product.desc}</Text>
          </>
        )}

        {product.specs.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Specifications</Text>
            {(product.specs as Array<{ label?: string; value?: string; k?: string; v?: string }>).map((spec, i) => (
              <View key={i} style={styles.specRow}>
                <Text style={styles.specLabel}>{spec.label ?? spec.k}</Text>
                <Text style={styles.specValue}>{spec.value ?? spec.v}</Text>
              </View>
            ))}
          </>
        )}

        {product.tags.length > 0 && (
          <View style={styles.tagRow}>
            {product.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.inquireButton}
          onPress={() =>
            navigation.navigate("Inquiry", {
              productId: product.id,
              supplierId: product.supplier,
              productName: product.name,
            })
          }
        >
          <Text style={styles.inquireButtonText}>Send inquiry</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  notFound: { color: colors.muted, fontSize: 15 },
  image: { width: "100%", height: 240, backgroundColor: "#E1E6EA" },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  imagePlaceholderText: { fontSize: 48, color: colors.muted, fontWeight: "700" },
  body: { padding: 16 },
  name: { fontSize: 20, fontWeight: "700", color: colors.text },
  price: { fontSize: 22, fontWeight: "800", color: colors.primary, marginTop: 6 },
  moq: { fontSize: 13, color: colors.muted, marginTop: 4 },
  supplierRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, padding: 12, backgroundColor: colors.card, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  supplierName: { fontWeight: "700", color: colors.text },
  supplierMeta: { color: colors.muted, fontSize: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 20, marginBottom: 8 },
  desc: { color: colors.text, lineHeight: 20 },
  specRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  specLabel: { color: colors.muted },
  specValue: { color: colors.text, fontWeight: "600" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  tag: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10 },
  tagText: { fontSize: 11, color: colors.muted },
  inquireButton: { backgroundColor: colors.primary, borderRadius: 10, padding: 16, alignItems: "center", marginTop: 24, marginBottom: 12 },
  inquireButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
