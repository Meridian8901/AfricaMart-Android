import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  getSupplierProfile,
  getSupplierSettings,
  saveSupplierSettings,
  saveSupplierStore,
  uploadSupplierMedia,
} from "../../services/supplier.service";
import { useAuthStore } from "../../store/useAuthStore";
import { colors } from "../../theme";

export default function SupplierStoreSettingsScreen() {
  const { session, supplierProfile } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [newLogo, setNewLogo] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [newBanner, setNewBanner] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [aboutImageUrl, setAboutImageUrl] = useState<string | null>(null);
  const [newAboutImage, setNewAboutImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [bio, setBio] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [businessHours, setBusinessHours] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (!session?.user || !supplierProfile) return;
    Promise.all([getSupplierSettings(session.user.id, supplierProfile.id), getSupplierProfile(supplierProfile.id)]).then(
      ([{ profile, entity }, fullSupplier]) => {
        setPhone(profile?.phone ?? "");
        setCountryCode(profile?.country_code ?? "");
        setEmailNotifications(profile?.email_notifications ?? true);
        setName(entity?.name ?? "");
        setLogoUrl(fullSupplier?.logoUrl ?? null);
        setBannerUrl(fullSupplier?.bannerUrl ?? null);
        setAboutImageUrl(fullSupplier?.aboutImageUrl ?? null);
        setBio(fullSupplier?.bio ?? "");
        setWebsiteUrl(fullSupplier?.websiteUrl ?? "");
        setBusinessHours(fullSupplier?.businessHours ?? "");
        setTags((fullSupplier?.tags || []).join(", "));
        setLoading(false);
      }
    );
  }, [session, supplierProfile]);

  async function pick(setter: (a: ImagePicker.ImagePickerAsset) => void) {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setter(result.assets[0]);
  }

  async function handleSave() {
    if (!session?.user || !supplierProfile) return;
    setSaving(true);
    try {
      await Promise.all([
        saveSupplierSettings(session.user.id, supplierProfile.id, { name, phone, countryCode, emailNotifications }),
        saveSupplierStore(supplierProfile.id, {
          bio,
          websiteUrl,
          businessHours,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      ]);
      if (newLogo) await uploadSupplierMedia(supplierProfile.id, "logo", { uri: newLogo.uri, fileName: newLogo.fileName, mimeType: newLogo.mimeType });
      if (newBanner) await uploadSupplierMedia(supplierProfile.id, "banner", { uri: newBanner.uri, fileName: newBanner.fileName, mimeType: newBanner.mimeType });
      if (newAboutImage)
        await uploadSupplierMedia(supplierProfile.id, "about", { uri: newAboutImage.uri, fileName: newAboutImage.fileName, mimeType: newAboutImage.mimeType });
      Alert.alert("Saved", "Your store settings have been updated.");
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

  const displayLogo = newLogo?.uri ?? logoUrl;
  const displayBanner = newBanner?.uri ?? bannerUrl;
  const displayAbout = newAboutImage?.uri ?? aboutImageUrl;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Banner</Text>
      <TouchableOpacity style={styles.bannerPicker} onPress={() => pick(setNewBanner)}>
        {displayBanner ? <Image source={{ uri: displayBanner }} style={styles.bannerImage} /> : <Text style={styles.pickerText}>Add banner image</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoPicker} onPress={() => pick(setNewLogo)}>
        {displayLogo ? <Image source={{ uri: displayLogo }} style={styles.logo} /> : <Text style={styles.pickerText}>Add logo</Text>}
      </TouchableOpacity>

      <Text style={styles.label}>Company name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Phone</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      <Text style={styles.label}>Country code</Text>
      <TextInput style={styles.input} value={countryCode} onChangeText={setCountryCode} placeholder="e.g. NG" autoCapitalize="characters" />

      <Text style={styles.label}>Bio</Text>
      <TextInput style={[styles.input, styles.textArea]} value={bio} onChangeText={setBio} multiline numberOfLines={4} />

      <Text style={styles.label}>About image</Text>
      <TouchableOpacity style={styles.aboutPicker} onPress={() => pick(setNewAboutImage)}>
        {displayAbout ? <Image source={{ uri: displayAbout }} style={styles.aboutImage} /> : <Text style={styles.pickerText}>Add about image</Text>}
      </TouchableOpacity>

      <Text style={styles.label}>Website</Text>
      <TextInput style={styles.input} value={websiteUrl} onChangeText={setWebsiteUrl} autoCapitalize="none" />

      <Text style={styles.label}>Business hours</Text>
      <TextInput style={styles.input} value={businessHours} onChangeText={setBusinessHours} placeholder="e.g. Mon-Fri 9am-6pm" />

      <Text style={styles.label}>Tags, comma separated</Text>
      <TextInput style={styles.input} value={tags} onChangeText={setTags} />

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
  bannerPicker: { height: 110, borderRadius: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginBottom: -36, overflow: "hidden" },
  bannerImage: { width: "100%", height: "100%" },
  logoPicker: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 20, overflow: "hidden" },
  logo: { width: "100%", height: "100%" },
  aboutPicker: { height: 110, borderRadius: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginBottom: 14, overflow: "hidden" },
  aboutImage: { width: "100%", height: "100%" },
  pickerText: { color: colors.muted, fontSize: 12, textAlign: "center" },
  label: { fontSize: 13, fontWeight: "700", color: colors.text, marginBottom: 6, marginTop: 4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, marginBottom: 14, backgroundColor: colors.card, fontSize: 14 },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  saveButton: { backgroundColor: colors.primary, borderRadius: 10, padding: 16, alignItems: "center", marginTop: 8 },
  saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
