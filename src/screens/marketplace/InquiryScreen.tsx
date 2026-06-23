import { useRef, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/HomeStack";
import { submitInquiry } from "../../services/catalog.service";
import { useAuthStore } from "../../store/useAuthStore";
import TurnstileWidget, { type TurnstileWidgetHandle } from "../../components/TurnstileWidget";
import { colors } from "../../theme";

type Props = NativeStackScreenProps<HomeStackParamList, "Inquiry">;

export default function InquiryScreen({ navigation, route }: Props) {
  const { productId, supplierId, productName } = route.params;
  const { authState, buyerProfile } = useAuthStore();

  const [requestType, setRequestType] = useState<"inquiry" | "sample">("inquiry");
  const [buyerName, setBuyerName] = useState(authState?.name ?? "");
  const [buyerEmail, setBuyerEmail] = useState(authState?.email ?? "");
  const [buyerCompany, setBuyerCompany] = useState(authState?.company ?? "");
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState(productName ? `Hi, I'm interested in "${productName}". Could you share more details?` : "");
  const [busy, setBusy] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  async function handleSubmit() {
    if (!buyerName || !buyerEmail || !message) {
      Alert.alert("Missing info", "Name, email and a message are required.");
      return;
    }
    if (!turnstileToken) {
      Alert.alert("Please wait", "Verification check is still loading — try again in a moment.");
      return;
    }
    setBusy(true);
    try {
      await submitInquiry({
        product_id: productId,
        supplier_id: supplierId,
        buyer_id: buyerProfile?.id ?? null,
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        buyer_company: buyerCompany || null,
        message,
        quantity: quantity || null,
        request_type: requestType,
        turnstileToken,
      });
      Alert.alert("Sent!", "Your inquiry has been sent to the supplier.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert("Couldn't send inquiry", e.message ?? "Please try again.");
      turnstileRef.current?.reset();
      setTurnstileToken("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.modeRow}>
        {(["inquiry", "sample"] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.modeButton, requestType === t && styles.modeButtonActive]} onPress={() => setRequestType(t)}>
            <Text style={[styles.modeText, requestType === t && styles.modeTextActive]}>
              {t === "inquiry" ? "General inquiry" : "Request sample"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput style={styles.input} placeholder="Your name" value={buyerName} onChangeText={setBuyerName} />
      <TextInput
        style={styles.input}
        placeholder="Your email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={buyerEmail}
        onChangeText={setBuyerEmail}
      />
      <TextInput style={styles.input} placeholder="Company (optional)" value={buyerCompany} onChangeText={setBuyerCompany} />
      <TextInput style={styles.input} placeholder="Quantity needed (optional)" value={quantity} onChangeText={setQuantity} />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Message"
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={5}
      />

      <TurnstileWidget ref={turnstileRef} onToken={setTurnstileToken} onExpire={() => setTurnstileToken("")} />

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Send</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16 },
  modeRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  modeButton: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, alignItems: "center" },
  modeButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  modeText: { color: colors.text, fontWeight: "600", fontSize: 13 },
  modeTextActive: { color: "#fff" },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    backgroundColor: colors.card,
    fontSize: 14,
  },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  submitButton: { backgroundColor: colors.primary, borderRadius: 10, padding: 16, alignItems: "center", marginTop: 8 },
  submitButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
