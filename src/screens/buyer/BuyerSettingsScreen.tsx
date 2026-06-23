import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { getBuyerSettings, saveBuyerSettings } from "../../services/buyer.service";
import { useAuthStore } from "../../store/useAuthStore";
import { colors } from "../../theme";

export default function BuyerSettingsScreen() {
  const { session, buyerProfile } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [deliveryCountryCode, setDeliveryCountryCode] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);

  useEffect(() => {
    if (!session?.user || !buyerProfile) return;
    getBuyerSettings(session.user.id, buyerProfile.id).then(({ profile, entity }) => {
      setPhone(profile?.phone ?? "");
      setCountryCode(profile?.country_code ?? "");
      setEmailNotifications(profile?.email_notifications ?? true);
      setName(entity?.name ?? "");
      setAddressLine(entity?.address_line ?? "");
      setDeliveryCountryCode(entity?.delivery_country_code ?? "");
      setLoading(false);
    });
  }, [session, buyerProfile]);

  async function handleSave() {
    if (!session?.user || !buyerProfile) return;
    setSaving(true);
    try {
      await saveBuyerSettings(session.user.id, buyerProfile.id, {
        name,
        phone,
        countryCode,
        emailNotifications,
        addressLine,
        deliveryCountryCode,
      });
      Alert.alert("Saved", "Your settings have been updated.");
    } catch (e: any) {
      Alert.alert("Couldn't save settings", e.message ?? "Please try again.");
    } finally {
      setSaving(false);
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Company / contact name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Phone</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      <Text style={styles.label}>Country code</Text>
      <TextInput style={styles.input} value={countryCode} onChangeText={setCountryCode} placeholder="e.g. NG" autoCapitalize="characters" />

      <Text style={styles.label}>Delivery address</Text>
      <TextInput style={styles.input} value={addressLine} onChangeText={setAddressLine} />

      <Text style={styles.label}>Delivery country code</Text>
      <TextInput style={styles.input} value={deliveryCountryCode} onChangeText={setDeliveryCountryCode} placeholder="e.g. NG" autoCapitalize="characters" />

      <View style={styles.switchRow}>
        <Text style={styles.label}>Email notifications</Text>
        <Switch value={emailNotifications} onValueChange={setEmailNotifications} />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  content: { padding: 16 },
  label: { fontSize: 13, fontWeight: "700", color: colors.text, marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    backgroundColor: colors.card,
    fontSize: 14,
  },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  saveButton: { backgroundColor: colors.primary, borderRadius: 10, padding: 16, alignItems: "center", marginTop: 8 },
  saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
