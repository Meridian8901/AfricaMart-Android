import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Supplier } from "../services/mappers";
import { colors } from "../theme";

export default function SupplierCard({ supplier, onPress }: { supplier: Supplier; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={[styles.avatar, { backgroundColor: supplier.color }]}>
        <Text style={styles.avatarText}>{supplier.name?.[0] ?? "?"}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {supplier.name} {supplier.verified ? "✓" : ""}
        </Text>
        <Text style={styles.meta}>
          {supplier.country} · ⭐ {supplier.rating.toFixed(1)} ({supplier.reviews})
        </Text>
        <Text style={styles.meta}>{supplier.products} products</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: "700", color: colors.text },
  meta: { fontSize: 12, color: colors.muted, marginTop: 2 },
});
