// Navigations/AppNavigator.js
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useApp } from "../app/context"; // ✅ use context instead of props
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import MediaDetailScreen from "../screens/MediaDetailsScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { accessToken } = useApp(); // ✅ grab from context

  return (
    <Stack.Navigator>
      {!accessToken ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: "Instagram Insights" }}
          />
          <Stack.Screen
            name="MediaDetail"
            component={MediaDetailScreen}
            options={{ title: "Post Details" }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
