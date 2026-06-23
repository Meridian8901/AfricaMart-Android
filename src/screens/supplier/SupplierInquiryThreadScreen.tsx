import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DashboardStackParamList } from "../../navigation/DashboardStack";
import { getInquiryMessages, sendInquiryMessage, type InquiryMessage } from "../../services/supplier.service";
import { colors } from "../../theme";

type Props = NativeStackScreenProps<DashboardStackParamList, "SupplierInquiryThread">;

export default function SupplierInquiryThreadScreen({ route }: Props) {
  const { inquiryId, subject } = route.params;
  const [messages, setMessages] = useState<InquiryMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const rows = await getInquiryMessages(inquiryId);
    setMessages(rows);
    setLoading(false);
  }, [inquiryId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleSend() {
    if (!draft.trim()) return;
    setSending(true);
    try {
      await sendInquiryMessage(inquiryId, "supplier", draft.trim());
      setDraft("");
      await load();
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Text style={styles.subject}>{subject}</Text>
      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.senderRole === "supplier" ? styles.bubbleMine : styles.bubbleTheirs]}>
            <Text style={item.senderRole === "supplier" ? styles.bubbleTextMine : styles.bubbleText}>{item.body}</Text>
            <Text style={styles.bubbleTime}>{item.time}</Text>
          </View>
        )}
      />
      <View style={styles.inputRow}>
        <TextInput style={styles.input} placeholder="Type a reply" value={draft} onChangeText={setDraft} multiline />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={sending}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  subject: { fontWeight: "700", color: colors.text, padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  list: { padding: 12, gap: 8 },
  bubble: { maxWidth: "80%", borderRadius: 12, padding: 10, marginBottom: 8 },
  bubbleMine: { backgroundColor: colors.primary, alignSelf: "flex-end" },
  bubbleTheirs: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignSelf: "flex-start" },
  bubbleText: { color: colors.text },
  bubbleTextMine: { color: "#fff" },
  bubbleTime: { fontSize: 10, color: colors.muted, marginTop: 4 },
  inputRow: { flexDirection: "row", padding: 10, borderTopWidth: 1, borderTopColor: colors.border, gap: 8, alignItems: "flex-end" },
  input: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, backgroundColor: colors.card, maxHeight: 100 },
  sendButton: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  sendText: { color: "#fff", fontWeight: "700" },
});
