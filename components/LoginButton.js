// components/LoginButton.js
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { WebView } from "react-native-webview";
import { useApp } from "../app/context";
import { AuthService } from "../services/authService";

// ⚠️ Dev-only: do not ship secrets in production apps
const INSTAGRAM_APP_ID = "1112015731097833";
const INSTAGRAM_CLIENT_SECRET = "58e8110c5d6160e7c4501aa829a33cd4"; // updated with new client secret
const REDIRECT_URI = "https://2d4680f320d0.ngrok-free.app/"; // updated ngrok URL (must match Meta config)

const SCOPES = [
  "instagram_business_basic",
  "instagram_business_content_publish",
  "pages_show_list",
  "instagram_business_manage_comments",
  "instagram_business_manage_insights",
].join(",");

const AUTH_URL = `https://www.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(
  REDIRECT_URI
)}&scope=${encodeURIComponent(SCOPES)}&response_type=code`;

export default function LoginButton() {
  const { setAccessToken } = useApp();
  const [showWebView, setShowWebView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exchanging, setExchanging] = useState(false);

  const handleNavigation = async (event) => {
    if (!event.url.startsWith(REDIRECT_URI) || exchanging) return;

    const query = event.url.split("?")[1] || "";
    const params = new URLSearchParams(query);
    const code = params.get("code");
    const error = params.get("error");

    if (error) {
      console.error("OAuth error:", error);
      return;
    }
    if (!code) return;

    setExchanging(true);
    try {
      const token = await exchangeCodeForToken(code);
      if (token) {
        await AuthService.saveToken(token);
        setAccessToken(token);
        setShowWebView(false);
      }
    } catch (err) {
      console.error("Exchange failed:", err);
    } finally {
      setExchanging(false);
    }
  };

  const handleLoginPress = () => {
    if (Platform.OS === "web") {
      const win = window.open(AUTH_URL, "_blank", "width=600,height=700");
      if (!win) alert("Please allow popups for this site.");
    } else {
      // On mobile, use WebView to handle redirect
      setLoading(true);
      setShowWebView(true);
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.button} onPress={handleLoginPress}>
        <Text style={styles.buttonText}>Login with Instagram</Text>
      </TouchableOpacity>

      {Platform.OS !== "web" && (
        <Modal visible={showWebView} animationType="slide">
          <View style={{ flex: 1 }}>
            <WebView
              source={{ uri: AUTH_URL }}
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
      )}
    </>
  );
}

// Dev-only: exchange code -> token
async function exchangeCodeForToken(code) {
  const body = new URLSearchParams({
    client_id: INSTAGRAM_APP_ID,
    client_secret: INSTAGRAM_CLIENT_SECRET,
    grant_type: "authorization_code",
    redirect_uri: REDIRECT_URI,
    code,
  }).toString();

  const res = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const json = await res.json();
  console.log("Token response:", json);

  if (!json.access_token) {
    throw new Error("Failed to exchange code: " + JSON.stringify(json));
  }

  // Try long-lived token
  try {
    const longRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${INSTAGRAM_CLIENT_SECRET}&access_token=${json.access_token}`
    );
    const longJson = await longRes.json();
    console.log("Long token response:", longJson);
    return longJson.access_token || json.access_token;
  } catch (err) {
    console.warn("Long token exchange failed, using short token", err);
    return json.access_token;
  }
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#4267B2",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "600" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});
