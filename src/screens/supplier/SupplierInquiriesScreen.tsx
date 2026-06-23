import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DashboardStackParamList } from "../../navigation/DashboardStack";
import { getSupplierInquiries, type Inquiry } from "../../services/supplier.service";
import { useAuthStore } from "../../store/useAuthStore";
import { colors } from "../../theme";

type Props = NativeStackScreenProps<DashboardStackParamList, "SupplierInquiries">;

export default function SupplierInquiriesScreen({ navigation }: Props) {
  const supplierProfile = useAuthStore((s) => s.supplierProfile);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!supplierProfile) return;
      let active = true;
      getSupplierInquiries(supplierProfile.id).then((rows) => {
        if (active) {
          setInquiries(rows);
          setLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }, [supplierProfile])
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
      data={inquiries}
      keyExtractor={(i) => i.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.empty}>No inquiries yet.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("SupplierInquiryThread", { inquiryId: item.id, subject: item.subj })}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.who}>{item.who}</Text>
            <Text style={[styles.status, item.status === "New" && styles.statusNew]}>{item.status}</Text>
          </View>
          <Text style={styles.subj}>{item.subj}</Text>
          <Text style={styles.last} numberOfLines={1}>
            {item.last}
          </Text>
          <Text style={styles.time}>{item.time}</Text>
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
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  who: { fontWeight: "700", color: colors.text },
  status: { fontSize: 11, color: colors.muted, textTransform: "uppercase" },
  statusNew: { color: colors.primary, fontWeight: "700" },
  subj: { color: colors.text, marginTop: 4, fontWeight: "600", fontSize: 13 },
  last: { color: colors.muted, marginTop: 4, fontSize: 13 },
  time: { color: colors.muted, fontSize: 11, marginTop: 6 },
});
