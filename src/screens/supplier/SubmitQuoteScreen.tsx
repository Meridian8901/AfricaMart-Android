import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RFQStackParamList } from "../../navigation/RFQStack";
import { submitQuote } from "../../services/rfq.service";
import { useAuthStore } from "../../store/useAuthStore";
import { colors } from "../../theme";

type Props = NativeStackScreenProps<RFQStackParamList, "SubmitQuote">;

export default function SubmitQuoteScreen({ navigation, route }: Props) {
  const { rfqId } = route.params;
  const supplierProfile = useAuthStore((s) => s.supplierProfile);

  const [price, setPrice] = useState("");
  const [leadTime, setLeadTime] = useState("");
  const [message, setMessage] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [incoterm, setIncoterm] = useState("");
  const [busy, setBusy] = useState(false);

  if (!supplierProfile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notice}>Sign in as a supplier to submit a quote.</Text>
      </View>
    );
  }

  async function handleSubmit() {
    if (!price || !leadTime) {
      Alert.alert("Missing info", "Price and lead time are required.");
      return;
    }
    setBusy(true);
    try {
      await submitQuote(rfqId, supplierProfile!.id, {
        priceUSD: Number(price),
        leadTime,
        message,
        paymentTerms,
        incoterm,
      });
      Alert.alert("Quote sent", "The buyer can now review your quote.", [{ text: "OK", onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      Alert.alert("Couldn't submit quote", e.message ?? "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TextInput style={styles.input} placeholder="Price (USD)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
      <TextInput style={styles.input} placeholder="Lead time (e.g. 2-3 weeks)" value={leadTime} onChangeText={setLeadTime} />
      <TextInput style={styles.input} placeholder="Payment terms (optional)" value={paymentTerms} onChangeText={setPaymentTerms} />
      <TextInput style={styles.input} placeholder="Incoterm (optional, e.g. FOB)" value={incoterm} onChangeText={setIncoterm} autoCapitalize="characters" />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Message to buyer (optional)"
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={5}
      />

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit quote</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, padding: 24 },
  notice: { color: colors.muted, fontSize: 15, textAlign: "center" },
  content: { padding: 16 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, marginBottom: 12, backgroundColor: colors.card, fontSize: 14 },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  submitButton: { backgroundColor: colors.primary, borderRadius: 10, padding: 16, alignItems: "center", marginTop: 8 },
  submitButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
