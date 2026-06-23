import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { useAuthStore } from "../store/useAuthStore";
import AuthStack from "./AuthStack";
import MainTabs from "./MainTabs";
import { colors } from "../theme";

export default function RootNavigator() {
  const { initializing, session, init } = useAuthStore();

  useEffect(() => {
    init();
  }, []);

  if (initializing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return <NavigationContainer>{session ? <MainTabs /> : <AuthStack />}</NavigationContainer>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
});
