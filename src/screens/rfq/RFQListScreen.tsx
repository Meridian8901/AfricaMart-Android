import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RFQStackParamList } from "../../navigation/RFQStack";
import { getOpenRFQs } from "../../services/rfq.service";
import type { RFQ } from "../../services/mappers";
import { colors } from "../../theme";

type Props = NativeStackScreenProps<RFQStackParamList, "RFQList">;

export default function RFQListScreen({ navigation }: Props) {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getOpenRFQs().then((rows) => {
        if (active) {
          setRfqs(rows);
          setLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.postButton} onPress={() => navigation.navigate("RFQSubmit")}>
        <Text style={styles.postButtonText}>+ Post an RFQ</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={rfqs}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("RFQDetail", { rfqId: item.id })}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>
                {item.qty} · {item.country}
              </Text>
              <View style={styles.footer}>
                <Text style={styles.posted}>{item.posted}</Text>
                <Text style={styles.quotes}>{item.quotes} quotes</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No open RFQs right now.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  postButton: { backgroundColor: colors.primary, margin: 12, borderRadius: 10, padding: 14, alignItems: "center" },
  postButtonText: { color: "#fff", fontWeight: "700" },
  loader: { marginTop: 40 },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  card: { backgroundColor: colors.card, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 10 },
  title: { fontSize: 15, fontWeight: "700", color: colors.text },
  meta: { fontSize: 13, color: colors.muted, marginTop: 4 },
  footer: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  posted: { fontSize: 11, color: colors.muted },
  quotes: { fontSize: 11, color: colors.primary, fontWeight: "700" },
  empty: { textAlign: "center", color: colors.muted, marginTop: 40 },
});
