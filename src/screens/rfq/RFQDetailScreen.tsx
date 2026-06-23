import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RFQStackParamList } from "../../navigation/RFQStack";
import { acceptQuote, declineQuote, getQuotesForRFQ, getRFQById } from "../../services/rfq.service";
import { useAuthStore } from "../../store/useAuthStore";
import { colors } from "../../theme";
import type { Quote, RFQ } from "../../services/mappers";

type Props = NativeStackScreenProps<RFQStackParamList, "RFQDetail">;

export default function RFQDetailScreen({ navigation, route }: Props) {
  const { rfqId } = route.params;
  const { buyerProfile, supplierProfile } = useAuthStore();
  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyQuoteId, setBusyQuoteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [rfqRow, quoteRows] = await Promise.all([getRFQById(rfqId), getQuotesForRFQ(rfqId)]);
    setRfq(rfqRow);
    setQuotes(quoteRows);
    setLoading(false);
  }, [rfqId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const isOwner = !!buyerProfile && rfq?.buyerId === buyerProfile.id;
  const myQuote = supplierProfile ? quotes.find((q) => q.supplierId === supplierProfile.id) : undefined;
  const canQuote = !!supplierProfile && rfq?.status === "open";

  async function handleAccept(quote: Quote) {
    setBusyQuoteId(quote.id);
    try {
      await acceptQuote(rfqId, quote.id);
      await load();
      Alert.alert("Quote accepted", `An order has been created with ${quote.supplier.name}.`);
    } catch (e: any) {
      Alert.alert("Couldn't accept quote", e.message ?? "Please try again.");
    } finally {
      setBusyQuoteId(null);
    }
  }

  async function handleDecline(quote: Quote) {
    setBusyQuoteId(quote.id);
    try {
      await declineQuote(quote.id);
      await load();
    } catch (e: any) {
      Alert.alert("Couldn't decline quote", e.message ?? "Please try again.");
    } finally {
      setBusyQuoteId(null);
    }
  }

  if (loading || !rfq) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.title}>{rfq.title}</Text>
        <Text style={styles.meta}>
          {rfq.qty} · {rfq.country}
        </Text>
        {rfq.deadline && <Text style={styles.meta}>Deadline: {rfq.deadline}</Text>}
        {rfq.desc && <Text style={styles.desc}>{rfq.desc}</Text>}

        {canQuote && (
          <TouchableOpacity style={styles.quoteButton} onPress={() => navigation.navigate("SubmitQuote", { rfqId })}>
            <Text style={styles.quoteButtonText}>{myQuote ? "Update your quote" : "Submit a quote"}</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>Quotes ({quotes.length})</Text>
        <FlatList
          data={quotes}
          keyExtractor={(q) => q.id}
          scrollEnabled={false}
          ListEmptyComponent={<Text style={styles.empty}>No quotes yet.</Text>}
          renderItem={({ item }) => (
            <View style={styles.quoteCard}>
              <View style={styles.quoteHeader}>
                <Text style={styles.supplierName}>
                  {item.supplier.name} {item.supplier.verified ? "✓" : ""}
                </Text>
                <Text style={styles.quoteStatus}>{item.status}</Text>
              </View>
              <Text style={styles.quotePrice}>${Number(item.priceUSD).toLocaleString()}</Text>
              <Text style={styles.meta}>Lead time: {item.leadTime}</Text>
              {item.message && <Text style={styles.quoteMessage}>{item.message}</Text>}

              {isOwner && item.status === "pending" && rfq.status === "open" && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.acceptButton} disabled={busyQuoteId === item.id} onPress={() => handleAccept(item)}>
                    <Text style={styles.acceptText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.declineButton} disabled={busyQuoteId === item.id} onPress={() => handleDecline(item)}>
                    <Text style={styles.declineText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  body: { padding: 16 },
  title: { fontSize: 19, fontWeight: "700", color: colors.text },
  meta: { fontSize: 13, color: colors.muted, marginTop: 4 },
  desc: { color: colors.text, marginTop: 12, lineHeight: 20 },
  quoteButton: { backgroundColor: colors.primary, borderRadius: 10, padding: 14, alignItems: "center", marginTop: 16 },
  quoteButtonText: { color: "#fff", fontWeight: "700" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 24, marginBottom: 10 },
  empty: { color: colors.muted },
  quoteCard: { backgroundColor: colors.card, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 10 },
  quoteHeader: { flexDirection: "row", justifyContent: "space-between" },
  supplierName: { fontWeight: "700", color: colors.text },
  quoteStatus: { fontSize: 11, color: colors.muted, textTransform: "uppercase" },
  quotePrice: { fontSize: 18, fontWeight: "800", color: colors.primary, marginTop: 6 },
  quoteMessage: { color: colors.text, marginTop: 8 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  acceptButton: { flex: 1, backgroundColor: colors.primary, borderRadius: 8, padding: 10, alignItems: "center" },
  acceptText: { color: "#fff", fontWeight: "700" },
  declineButton: { flex: 1, borderWidth: 1, borderColor: colors.danger, borderRadius: 8, padding: 10, alignItems: "center" },
  declineText: { color: colors.danger, fontWeight: "700" },
});
