import { NavigationContainer } from "@react-navigation/native";
import { AppProvider } from "./app/context"; // your context provider
import AppNavigator from "./Navigations/AppNavigator"; // your stack navigator

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AppProvider>
  );
}
