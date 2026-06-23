import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RFQListScreen from "../screens/rfq/RFQListScreen";
import RFQDetailScreen from "../screens/rfq/RFQDetailScreen";
import RFQSubmitScreen from "../screens/rfq/RFQSubmitScreen";
import SubmitQuoteScreen from "../screens/supplier/SubmitQuoteScreen";
import { colors } from "../theme";

export type RFQStackParamList = {
  RFQList: undefined;
  RFQDetail: { rfqId: string };
  RFQSubmit: undefined;
  SubmitQuote: { rfqId: string };
};

const Stack = createNativeStackNavigator<RFQStackParamList>();

export default function RFQStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.text, headerStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="RFQList" component={RFQListScreen} options={{ title: "RFQs" }} />
      <Stack.Screen name="RFQDetail" component={RFQDetailScreen} options={{ title: "RFQ" }} />
      <Stack.Screen name="RFQSubmit" component={RFQSubmitScreen} options={{ title: "Post an RFQ" }} />
      <Stack.Screen name="SubmitQuote" component={SubmitQuoteScreen} options={{ title: "Submit a quote" }} />
    </Stack.Navigator>
  );
}
