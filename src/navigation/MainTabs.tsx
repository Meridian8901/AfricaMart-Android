import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import HomeStack from "./HomeStack";
import BrowseStack from "./BrowseStack";
import RFQStack from "./RFQStack";
import DashboardStack from "./DashboardStack";
import AccountScreen from "../screens/AccountScreen";
import { colors } from "../theme";

export type MainTabsParamList = {
  HomeTab: undefined;
  BrowseTab: undefined;
  RFQs: undefined;
  Dashboard: undefined;
  Account: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

const ICONS: Record<keyof MainTabsParamList, string> = {
  HomeTab: "🏠",
  BrowseTab: "🔎",
  RFQs: "📋",
  Dashboard: "📊",
  Account: "👤",
};

const LABELS: Record<keyof MainTabsParamList, string> = {
  HomeTab: "Home",
  BrowseTab: "Browse",
  RFQs: "RFQs",
  Dashboard: "Dashboard",
  Account: "Account",
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabel: LABELS[route.name as keyof MainTabsParamList],
        tabBarIcon: () => <Text>{ICONS[route.name as keyof MainTabsParamList]}</Text>,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen name="BrowseTab" component={BrowseStack} />
      <Tab.Screen name="RFQs" component={RFQStack} />
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}
