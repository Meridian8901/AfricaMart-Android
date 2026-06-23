import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DashboardStackParamList } from "../../navigation/DashboardStack";
import { getBuyerRFQs } from "../../services/buyer.service";
import { useAuthStore } from "../../store/useAuthStore";
import type { RFQ } from "../../services/mappers";
import { colors } from "../../theme";

type Props = NativeStackScreenProps<DashboardStackParamList, "MyRFQs">;

export default function MyRFQsScreen({ navigation }: Props) {
  const buyerProfile = useAuthStore((s) => s.buyerProfile);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!buyerProfile) return;
      let active = true;
      getBuyerRFQs(buyerProfile.id).then((rows) => {
        if (active) {
          setRfqs(rows);
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
      data={rfqs}
      keyExtractor={(r) => r.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.empty}>You haven't posted any RFQs yet.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("RFQDetail", { rfqId: item.id })}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>
            {item.qty} · {item.country}
          </Text>
          <View style={styles.footer}>
            <Text style={styles.status}>{item.status}</Text>
            <Text style={styles.quotes}>{item.quotes} quotes</Text>
          </View>
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
  quotes: { fontSize: 11, color: colors.primary, fontWeight: "700" },
});
