import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Product } from "../services/mappers";
import { colors } from "../theme";

export default function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {product.image ? (
        <Image source={{ uri: product.image }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={styles.imagePlaceholderText}>{product.name?.[0] ?? "?"}</Text>
        </View>
      )}
      <Text style={styles.name} numberOfLines={2}>
        {product.name}
      </Text>
      <Text style={styles.price}>
        ${product.priceUSD.toFixed(2)} / {product.unit}
      </Text>
      <Text style={styles.moq}>
        MOQ {product.moq} {product.moqUnit}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 10,
    margin: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: { width: "100%", height: 110, borderRadius: 8, backgroundColor: colors.bg, marginBottom: 8 },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  imagePlaceholderText: { fontSize: 28, color: colors.muted, fontWeight: "700" },
  name: { fontSize: 13, fontWeight: "600", color: colors.text, minHeight: 34 },
  price: { fontSize: 14, fontWeight: "700", color: colors.primary, marginTop: 4 },
  moq: { fontSize: 11, color: colors.muted, marginTop: 2 },
});
