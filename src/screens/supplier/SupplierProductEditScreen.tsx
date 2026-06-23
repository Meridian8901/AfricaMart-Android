import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DashboardStackParamList } from "../../navigation/DashboardStack";
import {
  createProduct,
  getProductById,
  updateProduct,
  updateProductMedia,
  uploadProductFile,
  uploadProductImage,
  type ProductAttachment,
} from "../../services/supplier.service";
import { useAuthStore } from "../../store/useAuthStore";
import { useAppDataStore } from "../../store/useAppDataStore";
import { colors } from "../../theme";

type Props = NativeStackScreenProps<DashboardStackParamList, "SupplierProductEdit">;

interface PendingAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

export default function SupplierProductEditScreen({ navigation, route }: Props) {
  const productId = route.params?.productId;
  const supplierProfile = useAuthStore((s) => s.supplierProfile);
  const { categories } = useAppDataStore();

  const [loading, setLoading] = useState(!!productId);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("");
  const [moq, setMoq] = useState("");
  const [desc, setDesc] = useState("");
  const [tags, setTags] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [newImage, setNewImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [attachments, setAttachments] = useState<ProductAttachment[]>([]);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAsset[]>([]);
  const [attachmentsChanged, setAttachmentsChanged] = useState(false);

  useEffect(() => {
    if (!productId) return;
    getProductById(productId).then((product) => {
      if (product) {
        setName(product.name);
        setSku(product.sku ?? "");
        setCategoryId(product.cat);
        setPrice(String(product.priceUSD ?? ""));
        setUnit(product.unit ?? "");
        setMoq(String(product.moq ?? ""));
        setDesc(product.desc ?? "");
        setTags((product.tags || []).join(", "));
        setImageUrl(product.image ?? null);
        setAttachments((product.attachments as ProductAttachment[]) ?? []);
      }
      setLoading(false);
    });
  }, [productId]);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setNewImage(result.assets[0]);
    }
  }

  async function addPendingPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPendingAttachments((prev) => [...prev, { uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType }]);
    }
  }

  async function addPendingFile() {
    const result = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"] });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPendingAttachments((prev) => [...prev, { uri: asset.uri, fileName: asset.name, mimeType: asset.mimeType }]);
    }
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setAttachmentsChanged(true);
  }

  function removePending(index: number) {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!supplierProfile) return;
    if (!name.trim()) {
      Alert.alert("Missing info", "Please give the product a name.");
      return;
    }
    setSaving(true);
    try {
      const fields = {
        category: categoryId ?? null,
        name: name.trim(),
        sku,
        price,
        unit,
        moq,
        desc,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      };

      const product = productId ? await updateProduct(productId, fields) : await createProduct(supplierProfile.id, fields);

      let coverUrl = imageUrl;
      if (newImage) {
        coverUrl = await uploadProductImage(supplierProfile.id, product.id, {
          uri: newImage.uri,
          fileName: newImage.fileName,
          mimeType: newImage.mimeType,
        });
      }

      let finalAttachments = attachments;
      if (pendingAttachments.length > 0) {
        const uploaded = await Promise.all(pendingAttachments.map((asset) => uploadProductFile(supplierProfile.id, product.id, asset)));
        finalAttachments = [...attachments, ...uploaded];
      }

      if (pendingAttachments.length > 0 || attachmentsChanged || coverUrl !== imageUrl) {
        await updateProductMedia(product.id, finalAttachments, coverUrl);
      }

      Alert.alert(productId ? "Product updated" : "Product added", "", [{ text: "OK", onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      Alert.alert("Couldn't save product", e.message ?? "Please try again.");
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

  const displayImage = newImage?.uri ?? imageUrl;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {displayImage ? (
          <Image source={{ uri: displayImage }} style={styles.image} />
        ) : (
          <Text style={styles.imagePickerText}>Tap to add a cover photo</Text>
        )}
      </TouchableOpacity>

      <TextInput style={styles.input} placeholder="Product name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="SKU (optional)" value={sku} onChangeText={setSku} />

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

      <View style={styles.row}>
        <TextInput style={[styles.input, styles.rowInput]} placeholder="Price (USD)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
        <TextInput style={[styles.input, styles.rowInput]} placeholder="Unit (e.g. piece)" value={unit} onChangeText={setUnit} />
      </View>
      <TextInput style={styles.input} placeholder="MOQ (minimum order quantity)" value={moq} onChangeText={setMoq} keyboardType="decimal-pad" />
      <TextInput style={styles.input} placeholder="Tags, comma separated" value={tags} onChangeText={setTags} />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description"
        value={desc}
        onChangeText={setDesc}
        multiline
        numberOfLines={5}
      />

      <Text style={styles.label}>Extra photos & spec sheets</Text>
      <View style={styles.attachmentList}>
        {attachments.map((a, i) => (
          <View key={`existing-${i}`} style={styles.attachmentRow}>
            <Text style={styles.attachmentName} numberOfLines={1}>
              {a.type === "image" ? "🖼" : "📄"} {a.name}
            </Text>
            <TouchableOpacity onPress={() => removeAttachment(i)}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}
        {pendingAttachments.map((a, i) => (
          <View key={`pending-${i}`} style={styles.attachmentRow}>
            <Text style={styles.attachmentName} numberOfLines={1}>
              ⬆ {a.fileName ?? "New file"} (pending)
            </Text>
            <TouchableOpacity onPress={() => removePending(i)}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}
        {attachments.length === 0 && pendingAttachments.length === 0 && <Text style={styles.emptyAttachments}>No extra files yet.</Text>}
      </View>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.addButton, styles.rowInput]} onPress={addPendingPhoto}>
          <Text style={styles.addButtonText}>+ Add photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.addButton, styles.rowInput]} onPress={addPendingFile}>
          <Text style={styles.addButtonText}>+ Add PDF</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>{productId ? "Save changes" : "Add product"}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  content: { padding: 16 },
  imagePicker: { height: 160, borderRadius: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginBottom: 16, overflow: "hidden" },
  image: { width: "100%", height: "100%" },
  imagePickerText: { color: colors.muted },
  label: { fontSize: 13, fontWeight: "700", color: colors.text, marginBottom: 8, marginTop: 4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, marginBottom: 12, backgroundColor: colors.card, fontSize: 14 },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 10 },
  rowInput: { flex: 1 },
  chip: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 14, marginRight: 8, marginBottom: 16 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, color: colors.text, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  attachmentList: { marginBottom: 12 },
  attachmentRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, marginBottom: 8 },
  attachmentName: { flex: 1, color: colors.text, fontSize: 13, marginRight: 8 },
  removeText: { color: colors.danger, fontSize: 12, fontWeight: "700" },
  emptyAttachments: { color: colors.muted, fontSize: 13 },
  addButton: { borderWidth: 1, borderColor: colors.primary, borderRadius: 8, padding: 10, alignItems: "center", marginBottom: 16 },
  addButtonText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  saveButton: { backgroundColor: colors.primary, borderRadius: 10, padding: 16, alignItems: "center", marginTop: 8 },
  saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
