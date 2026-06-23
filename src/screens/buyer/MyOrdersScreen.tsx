import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DashboardStackParamList } from "../../navigation/DashboardStack";
import { getBuyerOrders } from "../../services/buyer.service";
import { useAuthStore } from "../../store/useAuthStore";
import type { Order } from "../../services/mappers";
import { colors } from "../../theme";

type Props = NativeStackScreenProps<DashboardStackParamList, "MyOrders">;

export default function MyOrdersScreen({ navigation }: Props) {
  const buyerProfile = useAuthStore((s) => s.buyerProfile);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!buyerProfile) return;
      let active = true;
      getBuyerOrders(buyerProfile.id).then((rows) => {
        if (active) {
          setOrders(rows);
          setLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }, [buyerProfile])
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(o) => o.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.empty}>No orders yet.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          disabled={!item.supplierSlug}
          onPress={() => item.supplierSlug && navigation.navigate("Storefront", { slug: item.supplierSlug })}
        >
          <Text style={styles.title}>{item.productName}</Text>
          <Text style={styles.meta}>{item.supplierName ?? "Supplier"}</Text>
          <View style={styles.footer}>
            <Text style={styles.status}>{item.status}</Text>
            <Text style={styles.value}>${item.value.toLocaleString()}</Text>
          </View>
          <Text style={styles.date}>{item.date}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  list: { padding: 12, backgroundColor: colors.bg, flexGrow: 1 },
  empty: { textAlign: "center", color: colors.muted, marginTop: 40 },
  card: { backgroundColor: colors.card, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 10 },
  title: { fontSize: 15, fontWeight: "700", color: colors.text },
  meta: { fontSize: 13, color: colors.muted, marginTop: 4 },
  footer: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  status: { fontSize: 11, color: colors.muted, textTransform: "uppercase" },
  value: { fontSize: 14, color: colors.primary, fontWeight: "700" },
  date: { fontSize: 11, color: colors.muted, marginTop: 4 },
});
