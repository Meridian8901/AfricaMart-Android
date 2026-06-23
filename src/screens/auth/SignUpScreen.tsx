import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/AuthStack";
import { signUp, type Role } from "../../services/auth.service";
import { colors } from "../../theme";
import TurnstileWidget, { type TurnstileWidgetHandle } from "../../components/TurnstileWidget";

type Props = NativeStackScreenProps<AuthStackParamList, "SignUp">;

export default function SignUpScreen({ navigation }: Props) {
  const [role, setRole] = useState<Role>("buyer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  async function handleRegister() {
    if (!email || !password || !name) return;
    if (!turnstileToken) {
      Alert.alert("Please wait", "Verification check is still loading — try again in a moment.");
      return;
    }
    setBusy(true);
    try {
      const { session } = await signUp(email.trim(), password, { role, name }, turnstileToken);
      if (!session) {
        setConfirmed(true);
      }
      // If session is returned, onAuthStateChange in useAuthStore picks it up
      // and RootNavigator switches to MainTabs automatically.
    } catch (e: any) {
      Alert.alert("Sign up failed", e.message ?? "Please try again.");
      turnstileRef.current?.reset();
      setTurnstileToken("");
    } finally {
      setBusy(false);
    }
  }

  if (confirmed) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>We sent a verification link to {email}. Confirm it, then sign in.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.primaryButtonText}>Back to sign in</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>Join AfricaMart as a buyer or supplier</Text>

      <View style={styles.roleRow}>
        {(["buyer", "supplier"] as Role[]).map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.roleButton, role === r && styles.roleButtonActive]}
            onPress={() => setRole(r)}
          >
            <Text style={[styles.roleButtonText, role === r && styles.roleButtonTextActive]}>
              {r === "buyer" ? "I'm buying" : "I'm supplying"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput style={styles.input} placeholder="Full name" value={name} onChangeText={setName} />
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TurnstileWidget ref={turnstileRef} onToken={setTurnstileToken} onExpire={() => setTurnstileToken("")} />

      <TouchableOpacity style={styles.primaryButton} onPress={handleRegister} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Create account</Text>}
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.link}> Sign in</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", padding: 24, backgroundColor: colors.bg },
  title: { fontSize: 26, fontWeight: "700", color: colors.text, textAlign: "center" },
  subtitle: { fontSize: 15, color: colors.muted, textAlign: "center", marginTop: 4, marginBottom: 24 },
  roleRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  roleButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleButtonText: { color: colors.text, fontWeight: "600" },
  roleButtonTextActive: { color: "#fff" },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
    fontSize: 15,
  },
  primaryButton: { backgroundColor: colors.primary, borderRadius: 10, padding: 15, alignItems: "center", marginTop: 8 },
  primaryButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  link: { color: colors.primary, fontWeight: "600", marginTop: 16, textAlign: "center" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { color: colors.muted },
});
