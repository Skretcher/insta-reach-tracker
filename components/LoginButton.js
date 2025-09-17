import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

const FB_APP_ID = "1219279183336078";
// For local development, set this to your localhost redirect URI and add it to your Facebook App settings
const REDIRECT_URI = "http://localhost:8081/redirect";
const SCOPES = [
  "pages_show_list",
  "instagram_basic"
].join(",");
const FB_AUTH_URL = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(
  REDIRECT_URI
)}&scope=${encodeURIComponent(SCOPES)}&response_type=token`;

export default function LoginButton({ onLogin, buttonText = "Login with Facebook" }) {
  const [showWebView, setShowWebView] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleNavigation = (event) => {
    if (event.url.startsWith(REDIRECT_URI)) {
      // Facebook often returns token in the fragment (#access_token=...)
      const hash = event.url.split("#")[1] || "";
      const query = event.url.split("?")[1] || "";
      const fullParams = new URLSearchParams(hash || query);

      const token = fullParams.get("access_token");
      if (token) {
        setShowWebView(false);
        onLogin(token); // only called after real login
      }
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          setLoading(true);
          setShowWebView(true);
        }}
      >
        <Text style={styles.buttonText}>{buttonText}</Text>
      </TouchableOpacity>

      <Modal visible={showWebView} animationType="slide">
        <View style={{ flex: 1 }}>
          <WebView
            source={{ uri: FB_AUTH_URL }}
            onNavigationStateChange={handleNavigation}
            onLoadEnd={() => setLoading(false)}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color="#4267B2" />
              </View>
            )}
          />
          <TouchableOpacity
            style={[styles.button, { margin: 16 }]}
            onPress={() => setShowWebView(false)}
          >
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#4267B2",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
