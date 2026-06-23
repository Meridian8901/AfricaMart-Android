import { useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/AuthStack";
import { signIn, signInWithGoogle } from "../../services/auth.service";
import { colors } from "../../theme";
import TurnstileWidget, { type TurnstileWidgetHandle } from "../../components/TurnstileWidget";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  async function handleSignIn() {
    if (!email || !password) return;
    if (!turnstileToken) {
      Alert.alert("Please wait", "Verification check is still loading — try again in a moment.");
      return;
    }
    setBusy(true);
    try {
      await signIn(email.trim(), password, turnstileToken);
    } catch (e: any) {
      Alert.alert("Sign in failed", e.message ?? "Please check your credentials and try again.");
      turnstileRef.current?.reset();
      setTurnstileToken("");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      Alert.alert("Google sign-in failed", e.message ?? "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AfricaMart</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

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

      <TouchableOpacity style={styles.primaryButton} onPress={handleSignIn} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Sign in</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={handleGoogle} disabled={busy}>
        <Text style={styles.secondaryButtonText}>Continue with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
        <Text style={styles.link}>Forgot password?</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
          <Text style={styles.link}> Create one</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: colors.bg },
  title: { fontSize: 32, fontWeight: "700", color: colors.text, textAlign: "center" },
  subtitle: { fontSize: 15, color: colors.muted, textAlign: "center", marginTop: 4, marginBottom: 32 },
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
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  secondaryButtonText: { color: colors.text, fontWeight: "600", fontSize: 15 },
  link: { color: colors.primary, fontWeight: "600", marginTop: 16, textAlign: "center" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { color: colors.muted },
});
