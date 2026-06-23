import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DashboardStackParamList } from "../navigation/DashboardStack";
import { useAuthStore } from "../store/useAuthStore";
import { colors } from "../theme";

type Props = NativeStackScreenProps<DashboardStackParamList, "Dashboard">;

const BUYER_MENU: { label: string; screen: keyof DashboardStackParamList }[] = [
  { label: "My RFQs", screen: "MyRFQs" },
  { label: "My Orders", screen: "MyOrders" },
  { label: "Saved items", screen: "SavedItems" },
  { label: "Settings", screen: "BuyerSettings" },
];

export default function DashboardScreen({ navigation }: Props) {
  const { authState, buyerProfile, supplierProfile, setActiveRole } = useAuthStore();
  const hasBothRoles = !!buyerProfile && !!supplierProfile;
  const role = authState?.role ?? "buyer";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {hasBothRoles && (
        <View style={styles.switcher}>
          {(["buyer", "supplier"] as const).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.switchButton, role === r && styles.switchButtonActive]}
              onPress={() => setActiveRole(r)}
            >
              <Text style={[styles.switchText, role === r && styles.switchTextActive]}>
                {r === "buyer" ? "Buyer view" : "Supplier view"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {role === "supplier" ? (
        <SupplierMenu navigation={navigation} />
      ) : (
        <View style={styles.menu}>
          {BUYER_MENU.map((item) => (
            <TouchableOpacity key={item.screen} style={styles.menuItem} onPress={() => navigation.navigate(item.screen as any)}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function SupplierMenu({ navigation }: { navigation: Props["navigation"] }) {
  const items: { label: string; screen: keyof DashboardStackParamList }[] = [
    { label: "My products", screen: "SupplierProducts" },
    { label: "RFQs for you", screen: "MatchedRFQs" },
    { label: "Inquiries", screen: "SupplierInquiries" },
    { label: "Verification (KYC)", screen: "SupplierVerification" },
    { label: "Store settings", screen: "SupplierStoreSettings" },
    { label: "Analytics", screen: "SupplierAnalytics" },
  ];
  return (
    <View style={styles.menu}>
      {items.map((item) => (
        <TouchableOpacity key={item.screen} style={styles.menuItem} onPress={() => navigation.navigate(item.screen as any)}>
          <Text style={styles.menuLabel}>{item.label}</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16 },
  switcher: { flexDirection: "row", gap: 8, marginBottom: 20 },
  switchButton: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  switchButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  switchText: { color: colors.text, fontWeight: "600" },
  switchTextActive: { color: "#fff" },
  menu: { gap: 10 },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 16,
  },
  menuLabel: { fontSize: 15, fontWeight: "600", color: colors.text },
  chevron: { fontSize: 18, color: colors.muted },
});
