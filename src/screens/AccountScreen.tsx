import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuthStore } from "../store/useAuthStore";
import { signOut } from "../services/auth.service";
import { colors } from "../theme";

export default function AccountScreen() {
  const authState = useAuthStore((s) => s.authState);

  async function handleSignOut() {
    try {
      await signOut();
    } catch (e: any) {
      Alert.alert("Couldn't sign out", e.message ?? "Please try again.");
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{authState?.initials}</Text>
      </View>
      <Text style={styles.name}>{authState?.name}</Text>
      <Text style={styles.sub}>{authState?.sub}</Text>
      <Text style={styles.email}>{authState?.email}</Text>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, padding: 24 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: { color: "#fff", fontSize: 24, fontWeight: "700" },
  name: { fontSize: 20, fontWeight: "700", color: colors.text },
  sub: { fontSize: 14, color: colors.muted, marginTop: 2 },
  email: { fontSize: 14, color: colors.muted, marginTop: 8 },
  signOutButton: {
    marginTop: 32,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  signOutText: { color: colors.danger, fontWeight: "600" },
});
