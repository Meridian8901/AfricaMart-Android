import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import { getSupplierVerification, submitVerification, uploadKycDoc, type VerificationRow } from "../../services/supplier.service";
import { useAuthStore } from "../../store/useAuthStore";
import { colors } from "../../theme";

const REQUIRED_DOCS = ["Trade license", "Business registration", "Tax ID"];

export default function SupplierVerificationScreen() {
  const supplierProfile = useAuthStore((s) => s.supplierProfile);
  const [verification, setVerification] = useState<VerificationRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadedPaths, setUploadedPaths] = useState<Record<string, string>>({});
  const [busyDoc, setBusyDoc] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!supplierProfile) return;
    const row = await getSupplierVerification(supplierProfile.id);
    setVerification(row);
    setLoading(false);
  }, [supplierProfile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handlePick(docLabel: string) {
    if (!supplierProfile) return;
    const result = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"] });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setBusyDoc(docLabel);
    try {
      const path = await uploadKycDoc(supplierProfile.id, docLabel, {
        uri: asset.uri,
        fileName: asset.name,
        mimeType: asset.mimeType,
      });
      setUploadedPaths((prev) => ({ ...prev, [docLabel]: path }));
    } catch (e: any) {
      Alert.alert("Upload failed", e.message ?? "Please try again.");
    } finally {
      setBusyDoc(null);
    }
  }

  async function handleSubmit() {
    const paths = Object.values(uploadedPaths);
    if (paths.length === 0) {
      Alert.alert("Nothing to submit", "Upload at least one document first.");
      return;
    }
    setSubmitting(true);
    try {
      await submitVerification(paths);
      await load();
      Alert.alert("Submitted", "Your documents are now under review.");
    } catch (e: any) {
      Alert.alert("Couldn't submit", e.message ?? "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const status = verification?.status ?? "Not submitted";

  return (
    <View style={styles.container}>
      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>Status: {status}</Text>
      </View>

      <FlatList
        data={REQUIRED_DOCS}
        keyExtractor={(d) => d}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.docRow}>
            <Text style={styles.docLabel}>{item}</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={() => handlePick(item)} disabled={busyDoc === item}>
              {busyDoc === item ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <Text style={styles.uploadText}>{uploadedPaths[item] ? "Uploaded ✓" : "Upload"}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      />

      {verification?.reviewer_notes && (
        <View style={styles.notes}>
          <Text style={styles.notesLabel}>Reviewer notes</Text>
          <Text style={styles.notesText}>{verification.reviewer_notes}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit for review</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  statusBadge: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, marginBottom: 16 },
  statusText: { fontWeight: "700", color: colors.text, textTransform: "capitalize" },
  list: { gap: 10 },
  docRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, marginBottom: 10 },
  docLabel: { color: colors.text, fontWeight: "600" },
  uploadButton: { borderWidth: 1, borderColor: colors.primary, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  uploadText: { color: colors.primary, fontWeight: "700", fontSize: 12 },
  notes: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, marginTop: 12 },
  notesLabel: { fontWeight: "700", color: colors.text, fontSize: 12 },
  notesText: { color: colors.muted, marginTop: 4 },
  submitButton: { backgroundColor: colors.primary, borderRadius: 10, padding: 16, alignItems: "center", marginTop: 16 },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
