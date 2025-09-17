// App.js
import { NavigationContainer } from "@react-navigation/native";
import { useState } from "react";
import AppNavigator from "./Navigations/AppNavigator";

export default function App() {
  const [accessToken, setAccessToken] = useState(null);
  const [media, setMedia] = useState([]);

  return (
    <NavigationContainer>
      <AppNavigator
        accessToken={accessToken}
        media={media}
        setAccessToken={setAccessToken}
        setMedia={setMedia}
      />
    </NavigationContainer>
  );
}
