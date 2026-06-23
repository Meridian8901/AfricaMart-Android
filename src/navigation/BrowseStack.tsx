import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BrowseScreen from "../screens/marketplace/BrowseScreen";
import ProductDetailScreen from "../screens/marketplace/ProductDetailScreen";
import StorefrontScreen from "../screens/marketplace/StorefrontScreen";
import InquiryScreen from "../screens/marketplace/InquiryScreen";
import { colors } from "../theme";

export type BrowseStackParamList = {
  Browse: { cat?: string } | undefined;
  ProductDetail: { slug: string };
  Storefront: { slug: string };
  Inquiry: { productId: string | null; supplierId: string; productName?: string };
};

const Stack = createNativeStackNavigator<BrowseStackParamList>();

export default function BrowseStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.text, headerStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="Browse" component={BrowseScreen} options={{ title: "Browse" }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: "Product" }} />
      <Stack.Screen name="Storefront" component={StorefrontScreen} options={{ title: "Supplier" }} />
      <Stack.Screen name="Inquiry" component={InquiryScreen} options={{ title: "Send inquiry" }} />
    </Stack.Navigator>
  );
}
