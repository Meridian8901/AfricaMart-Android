import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DashboardStackParamList } from "../../navigation/DashboardStack";
import { getOrderById } from "../../services/buyer.service";
import type { Order } from "../../services/mappers";
import { colors } from "../../theme";

type Props = NativeStackScreenProps<DashboardStackParamList, "OrderDetail">;

export default function OrderDetailScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getOrderById(orderId).then((row) => {
        if (active) {
          setOrder(row);
          setLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }, [orderId])
  );

  if (loading || !order) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.title}>{order.productName}</Text>
        <Text style={styles.status}>{order.status}</Text>

        {order.supplierName && (
          <TouchableOpacity
            style={styles.supplierRow}
            disabled={!order.supplierSlug}
            onPress={() => order.supplierSlug && navigation.navigate("Storefront", { slug: order.supplierSlug })}
          >
            <Text style={styles.meta}>Supplier</Text>
            <Text style={styles.supplierName}>{order.supplierName}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.row}>
          <Text style={styles.meta}>Order value</Text>
          <Text style={styles.value}>
            {order.currency} {order.value.toLocaleString()}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.meta}>Placed on</Text>
          <Text style={styles.value}>{order.date}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.meta}>Order ID</Text>
          <Text style={styles.value}>{order.id}</Text>
        </View>

        {order.supplierId && (
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={() =>
              navigation.navigate("ReviewSubmit", {
                supplierId: order.supplierId!,
                supplierName: order.supplierName ?? "this supplier",
              })
            }
          >
            <Text style={styles.reviewButtonText}>Leave a review</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  body: { padding: 16 },
  title: { fontSize: 19, fontWeight: "700", color: colors.text },
  status: { fontSize: 11, color: colors.muted, textTransform: "uppercase", marginTop: 4 },
  supplierRow: { marginTop: 20 },
  supplierName: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 2 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  meta: { fontSize: 13, color: colors.muted },
  value: { fontSize: 14, color: colors.text, fontWeight: "600" },
  reviewButton: { backgroundColor: colors.primary, borderRadius: 10, padding: 14, alignItems: "center", marginTop: 28 },
  reviewButtonText: { color: "#fff", fontWeight: "700" },
});
