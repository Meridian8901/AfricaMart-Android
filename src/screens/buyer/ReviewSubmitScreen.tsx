import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DashboardStackParamList } from "../../navigation/DashboardStack";
import { submitReview } from "../../services/storefront.service";
import { useAuthStore } from "../../store/useAuthStore";
import { colors } from "../../theme";

type Props = NativeStackScreenProps<DashboardStackParamList, "ReviewSubmit">;

const STARS = [1, 2, 3, 4, 5];

export default function ReviewSubmitScreen({ navigation, route }: Props) {
  const { supplierId, supplierName } = route.params;
  const authState = useAuthStore((s) => s.authState);

  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (rating === 0) {
      Alert.alert("Add a rating", "Tap a star to rate your experience.");
      return;
    }
    if (!text.trim()) {
      Alert.alert("Add a comment", "Let other buyers know how it went.");
      return;
    }
    setBusy(true);
    try {
      await submitReview({
        supplierId,
        buyerName: authState?.name ?? "Anonymous buyer",
        rating,
        text: text.trim(),
      });
      Alert.alert("Review submitted", "Thanks for the feedback.", [{ text: "OK", onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      Alert.alert("Couldn't submit review", e.message ?? "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Review {supplierName}</Text>

      <View style={styles.starsRow}>
        {STARS.map((n) => (
          <TouchableOpacity key={n} onPress={() => setRating(n)} hitSlop={8}>
            <Text style={styles.star}>{n <= rating ? "★" : "☆"}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Share details about your experience with this supplier"
        value={text}
        onChangeText={setText}
        multiline
        numberOfLines={6}
      />

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit review</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16 },
  title: { fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: 16 },
  starsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  star: { fontSize: 32, color: colors.primary },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, marginBottom: 12, backgroundColor: colors.card, fontSize: 14 },
  textArea: { minHeight: 120, textAlignVertical: "top" },
  submitButton: { backgroundColor: colors.primary, borderRadius: 10, padding: 16, alignItems: "center", marginTop: 8 },
  submitButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
