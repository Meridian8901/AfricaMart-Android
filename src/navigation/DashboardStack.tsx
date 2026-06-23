import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DashboardScreen from "../screens/DashboardScreen";
import MyRFQsScreen from "../screens/buyer/MyRFQsScreen";
import MyOrdersScreen from "../screens/buyer/MyOrdersScreen";
import SavedItemsScreen from "../screens/buyer/SavedItemsScreen";
import BuyerSettingsScreen from "../screens/buyer/BuyerSettingsScreen";
import RFQDetailScreen from "../screens/rfq/RFQDetailScreen";
import ProductDetailScreen from "../screens/marketplace/ProductDetailScreen";
import StorefrontScreen from "../screens/marketplace/StorefrontScreen";
import InquiryScreen from "../screens/marketplace/InquiryScreen";
import SupplierProductsScreen from "../screens/supplier/SupplierProductsScreen";
import SupplierProductEditScreen from "../screens/supplier/SupplierProductEditScreen";
import SupplierInquiriesScreen from "../screens/supplier/SupplierInquiriesScreen";
import SupplierInquiryThreadScreen from "../screens/supplier/SupplierInquiryThreadScreen";
import SupplierVerificationScreen from "../screens/supplier/SupplierVerificationScreen";
import SupplierStoreSettingsScreen from "../screens/supplier/SupplierStoreSettingsScreen";
import SupplierAnalyticsScreen from "../screens/supplier/SupplierAnalyticsScreen";
import MatchedRFQsScreen from "../screens/supplier/MatchedRFQsScreen";
import SubmitQuoteScreen from "../screens/supplier/SubmitQuoteScreen";
import { colors } from "../theme";

export type DashboardStackParamList = {
  Dashboard: undefined;
  MyRFQs: undefined;
  MyOrders: undefined;
  SavedItems: undefined;
  BuyerSettings: undefined;
  RFQDetail: { rfqId: string };
  ProductDetail: { slug: string };
  Storefront: { slug: string };
  Inquiry: { productId: string | null; supplierId: string; productName?: string };
  SupplierProducts: undefined;
  SupplierProductEdit: { productId?: string };
  SupplierInquiries: undefined;
  SupplierInquiryThread: { inquiryId: string; subject: string };
  SupplierVerification: undefined;
  SupplierStoreSettings: undefined;
  SupplierAnalytics: undefined;
  MatchedRFQs: undefined;
  SubmitQuote: { rfqId: string };
};

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export default function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.text, headerStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Dashboard" }} />
      <Stack.Screen name="MyRFQs" component={MyRFQsScreen} options={{ title: "My RFQs" }} />
      <Stack.Screen name="MyOrders" component={MyOrdersScreen} options={{ title: "My Orders" }} />
      <Stack.Screen name="SavedItems" component={SavedItemsScreen} options={{ title: "Saved items" }} />
      <Stack.Screen name="BuyerSettings" component={BuyerSettingsScreen} options={{ title: "Settings" }} />
      <Stack.Screen name="RFQDetail" component={RFQDetailScreen} options={{ title: "RFQ" }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: "Product" }} />
      <Stack.Screen name="Storefront" component={StorefrontScreen} options={{ title: "Supplier" }} />
      <Stack.Screen name="Inquiry" component={InquiryScreen} options={{ title: "Send inquiry" }} />
      <Stack.Screen name="SupplierProducts" component={SupplierProductsScreen} options={{ title: "My products" }} />
      <Stack.Screen name="SupplierProductEdit" component={SupplierProductEditScreen} options={{ title: "Product" }} />
      <Stack.Screen name="SupplierInquiries" component={SupplierInquiriesScreen} options={{ title: "Inquiries" }} />
      <Stack.Screen name="SupplierInquiryThread" component={SupplierInquiryThreadScreen} options={{ title: "Conversation" }} />
      <Stack.Screen name="SupplierVerification" component={SupplierVerificationScreen} options={{ title: "Verification" }} />
      <Stack.Screen name="SupplierStoreSettings" component={SupplierStoreSettingsScreen} options={{ title: "Store settings" }} />
      <Stack.Screen name="SupplierAnalytics" component={SupplierAnalyticsScreen} options={{ title: "Analytics" }} />
      <Stack.Screen name="MatchedRFQs" component={MatchedRFQsScreen} options={{ title: "RFQs for you" }} />
      <Stack.Screen name="SubmitQuote" component={SubmitQuoteScreen} options={{ title: "Submit a quote" }} />
    </Stack.Navigator>
  );
}
