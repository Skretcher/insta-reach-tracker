// navigation/AppNavigator.js
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import MediaDetailScreen from "../screens/MediaDetailsScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator({ accessToken, media, setAccessToken, setMedia }) {
  return (
    <Stack.Navigator>
      {!accessToken ? (
        <Stack.Screen name="Login" options={{ headerShown: false }}>
          {(props) => <LoginScreen {...props} setAccessToken={setAccessToken} setMedia={setMedia} />}
        </Stack.Screen>
      ) : (
        <>
          <Stack.Screen name="Home" options={{ title: "Instagram Insights" }}>
            {(props) => <HomeScreen {...props} accessToken={accessToken} media={media} />}
          </Stack.Screen>
          <Stack.Screen name="MediaDetail" component={MediaDetailScreen} options={{ title: "Post Details" }} />
        </>
      )}
    </Stack.Navigator>
  );
}
