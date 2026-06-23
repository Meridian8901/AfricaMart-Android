import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getAnalytics, type SupplierAnalytics } from "../../services/supplier.service";
import { useAuthStore } from "../../store/useAuthStore";
import BarChart from "../../components/BarChart";
import { colors } from "../../theme";

function DeltaLabel({ value }: { value: number | null }) {
  if (value == null) return <Text style={styles.deltaNeutral}>—</Text>;
  const positive = value >= 0;
  return <Text style={positive ? styles.deltaUp : styles.deltaDown}>{positive ? "+" : ""}{value}%</Text>;
}

export default function SupplierAnalyticsScreen() {
  const supplierProfile = useAuthStore((s) => s.supplierProfile);
  const [data, setData] = useState<SupplierAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!supplierProfile) return;
      let active = true;
      getAnalytics(supplierProfile.id).then((result) => {
        if (active) {
          setData(result);
          setLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }, [supplierProfile])
  );

  if (loading || !data) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.value}>{data.profileViews.toLocaleString()}</Text>
          <Text style={styles.label}>Profile views</Text>
          <DeltaLabel value={data.deltas.profileViews} />
        </View>
        <View style={styles.card}>
          <Text style={styles.value}>{data.productViews.toLocaleString()}</Text>
          <Text style={styles.label}>Product views</Text>
          <DeltaLabel value={data.deltas.productViews} />
        </View>
        <View style={styles.card}>
          <Text style={styles.value}>{data.inquiriesTotal.toLocaleString()}</Text>
          <Text style={styles.label}>Total inquiries</Text>
          <Text style={styles.deltaNeutral}>{data.deltas.inquiriesLast7} last 7d</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.value}>{data.responseRate}%</Text>
          <Text style={styles.label}>Response rate</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.value}>{data.conversion.toFixed(1)}%</Text>
          <Text style={styles.label}>Conversion</Text>
        </View>
      </View>

      <Text style={styles.chartTitle}>Views, last 30 days</Text>
      <View style={styles.chartCard}>
        <BarChart data={data.chart} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  content: { padding: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { width: "47%", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16 },
  value: { fontSize: 24, fontWeight: "800", color: colors.text },
  label: { fontSize: 12, color: colors.muted, marginTop: 4 },
  deltaUp: { color: colors.primary, fontWeight: "700", fontSize: 12, marginTop: 6 },
  deltaDown: { color: colors.danger, fontWeight: "700", fontSize: 12, marginTop: 6 },
  deltaNeutral: { color: colors.muted, fontSize: 12, marginTop: 6 },
  chartTitle: { fontSize: 14, fontWeight: "700", color: colors.text, marginTop: 24, marginBottom: 10 },
  chartCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16 },
});
