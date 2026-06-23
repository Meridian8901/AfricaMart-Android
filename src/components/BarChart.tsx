import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

// Minimal dependency-free 30-day bar chart — avoids pulling in a chart
// library just to render a single sparkline-style trend.
export default function BarChart({ data, height = 80 }: { data: number[]; height?: number }) {
  const max = Math.max(1, ...data);
  return (
    <View style={[styles.container, { height }]}>
      {data.map((value, i) => (
        <View key={i} style={styles.barWrap}>
          <View style={[styles.bar, { height: Math.max(2, (value / max) * (height - 4)) }]} />
        </View>
      ))}
      {data.length === 0 && <Text style={styles.empty}>No data yet</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  barWrap: { flex: 1, alignItems: "center", justifyContent: "flex-end", height: "100%" },
  bar: { width: "100%", borderRadius: 2, backgroundColor: colors.primary },
  empty: { color: colors.muted, fontSize: 12 },
});
