import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/marketplace/HomeScreen";
import ProductDetailScreen from "../screens/marketplace/ProductDetailScreen";
import StorefrontScreen from "../screens/marketplace/StorefrontScreen";
import InquiryScreen from "../screens/marketplace/InquiryScreen";
import { colors } from "../theme";

export type HomeStackParamList = {
  Home: undefined;
  ProductDetail: { slug: string };
  Storefront: { slug: string };
  Inquiry: { productId: string | null; supplierId: string; productName?: string };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.text, headerStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: "AfricaMart" }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: "Product" }} />
      <Stack.Screen name="Storefront" component={StorefrontScreen} options={{ title: "Supplier" }} />
      <Stack.Screen name="Inquiry" component={InquiryScreen} options={{ title: "Send inquiry" }} />
    </Stack.Navigator>
  );
}
