import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RFQStackParamList } from "../../navigation/RFQStack";
import { submitRFQ } from "../../services/rfq.service";
import { useAuthStore } from "../../store/useAuthStore";
import { useAppDataStore } from "../../store/useAppDataStore";
import TurnstileWidget, { type TurnstileWidgetHandle } from "../../components/TurnstileWidget";
import { colors } from "../../theme";

type Props = NativeStackScreenProps<RFQStackParamList, "RFQSubmit">;

export default function RFQSubmitScreen({ navigation }: Props) {
  const { authState, buyerProfile, session } = useAuthStore();
  const { categories, countries } = useAppDataStore();

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [countryCode, setCountryCode] = useState<string | undefined>();
  const [quantityText, setQuantityText] = useState("");
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  if (!buyerProfile || !session) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notice}>Sign in as a buyer to post an RFQ.</Text>
      </View>
    );
  }

  async function handleSubmit() {
    if (!title.trim()) {
      Alert.alert("Missing info", "Please give your RFQ a title.");
      return;
    }
    if (!turnstileToken) {
      Alert.alert("Please wait", "Verification check is still loading — try again in a moment.");
      return;
    }
    setBusy(true);
    try {
      await submitRFQ(
        {
          title: title.trim(),
          category_id: categoryId ?? null,
          quantity_text: quantityText || null,
          destination_country: countryCode ?? null,
          buyer_id: buyerProfile!.id,
          buyer_name: authState?.name ?? "Buyer",
          deadline: deadline ? deadline.toISOString().slice(0, 10) : null,
          description: description || null,
          turnstileToken,
        },
        session!.access_token
      );
      Alert.alert("RFQ posted!", "Suppliers will start sending quotes shortly.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert("Couldn't post RFQ", e.message ?? "Please try again.");
      turnstileRef.current?.reset();
      setTurnstileToken("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TextInput style={styles.input} placeholder="RFQ title" value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Category</Text>
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, categoryId === item.id && styles.chipActive]}
            onPress={() => setCategoryId(categoryId === item.id ? undefined : item.id)}
          >
            <Text style={[styles.chipText, categoryId === item.id && styles.chipTextActive]}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.label}>Destination country</Text>
      <FlatList
        data={countries}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(c) => c.code}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, countryCode === item.code && styles.chipActive]}
            onPress={() => setCountryCode(countryCode === item.code ? undefined : item.code)}
          >
            <Text style={[styles.chipText, countryCode === item.code && styles.chipTextActive]}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      <TextInput style={styles.input} placeholder="Quantity needed (e.g. 500 units)" value={quantityText} onChangeText={setQuantityText} />

      <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
        <Text style={deadline ? styles.dateButtonText : styles.dateButtonPlaceholder}>
          {deadline ? `Deadline: ${deadline.toLocaleDateString()}` : "Set a deadline (optional)"}
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={deadline ?? new Date()}
          mode="date"
          minimumDate={new Date()}
          onChange={(_event, selectedDate) => {
            setShowDatePicker(Platform.OS === "ios");
            if (selectedDate) setDeadline(selectedDate);
          }}
        />
      )}

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe what you need"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={5}
      />

      <TurnstileWidget ref={turnstileRef} onToken={setTurnstileToken} onExpire={() => setTurnstileToken("")} />

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Post RFQ</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, padding: 24 },
  notice: { color: colors.muted, fontSize: 15, textAlign: "center" },
  label: { fontSize: 13, fontWeight: "700", color: colors.text, marginBottom: 8, marginTop: 4 },
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
  dateButton: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, marginBottom: 12, backgroundColor: colors.card },
  dateButtonText: { color: colors.text, fontSize: 14, fontWeight: "600" },
  dateButtonPlaceholder: { color: colors.muted, fontSize: 14 },
  chip: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 14, marginRight: 8, marginBottom: 16 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, color: colors.text, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  submitButton: { backgroundColor: colors.primary, borderRadius: 10, padding: 16, alignItems: "center", marginTop: 8 },
  submitButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
