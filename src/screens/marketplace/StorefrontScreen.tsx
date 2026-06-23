import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/HomeStack";
import { getProductsBySupplier, getReviewsBySupplier, getSupplierBySlug, trackProfileView } from "../../services/storefront.service";
import ProductCard from "../../components/ProductCard";
import { colors } from "../../theme";
import type { Product, Review, Supplier } from "../../services/mappers";

type Props = NativeStackScreenProps<HomeStackParamList, "Storefront">;

export default function StorefrontScreen({ navigation, route }: Props) {
  const { slug } = route.params;
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const s = await getSupplierBySlug(slug);
      setSupplier(s);
      trackProfileView(s.id);
      const [p, r] = await Promise.all([getProductsBySupplier(s.id), getReviewsBySupplier(s.id)]);
      setProducts(p);
      setReviews(r);
      setLoading(false);
    })();
  }, [slug]);

  if (loading || !supplier) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { backgroundColor: supplier.color }]}>
        <Text style={styles.avatarText}>{supplier.name[0]}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.name}>
          {supplier.name} {supplier.verified ? "✓" : ""}
        </Text>
        <Text style={styles.meta}>
          {supplier.country} · ⭐ {supplier.rating.toFixed(1)} ({supplier.reviews} reviews)
        </Text>
        {supplier.bio && <Text style={styles.bio}>{supplier.bio}</Text>}

        <Text style={styles.sectionTitle}>Products ({products.length})</Text>
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(p) => p.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <ProductCard product={item} onPress={() => navigation.push("ProductDetail", { slug: item.slug })} />
          )}
        />

        {reviews.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {reviews.map((r, i) => (
              <View key={i} style={styles.review}>
                <Text style={styles.reviewHeader}>
                  {r.buyer} · {r.country} · ⭐ {r.rating}
                </Text>
                <Text style={styles.reviewText}>{r.text}</Text>
                <Text style={styles.reviewDate}>{r.date}</Text>
              </View>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  header: { height: 120, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 40, color: "#fff", fontWeight: "800" },
  body: { padding: 16 },
  name: { fontSize: 20, fontWeight: "700", color: colors.text },
  meta: { fontSize: 13, color: colors.muted, marginTop: 4 },
  bio: { marginTop: 12, color: colors.text, lineHeight: 20 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 20, marginBottom: 8 },
  review: { backgroundColor: colors.card, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 8 },
  reviewHeader: { fontWeight: "700", color: colors.text, fontSize: 13 },
  reviewText: { color: colors.text, marginTop: 4 },
  reviewDate: { color: colors.muted, fontSize: 11, marginTop: 4 },
});
