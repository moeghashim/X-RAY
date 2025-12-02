import "react-native-gesture-handler";
import { useMemo } from "react";
import Constants from "expo-constants";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { enableScreens } from "react-native-screens";
import { HomeScreen } from "./src/screens/HomeScreen";
import { ResultsScreen } from "./src/screens/ResultsScreen";
import { RootStackParamList } from "./src/navigation/types";

enableScreens();

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const convexUrl =
    Constants.expoConfig?.extra?.convexUrl ??
    Constants.manifest2?.extra?.convexUrl ??
    "";

  const convexClient = useMemo(() => {
    if (!convexUrl) {
      console.warn(
        "convexUrl extra not set. Provide CONVEX_URL env when running Expo."
      );
    }
    return new ConvexReactClient(convexUrl || "http://localhost:3000");
  }, [convexUrl]);

  return (
    <SafeAreaProvider>
      <ConvexProvider client={convexClient}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Results" component={ResultsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </ConvexProvider>
    </SafeAreaProvider>
  );
}
