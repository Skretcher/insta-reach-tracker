// components/LoginButton.js
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useApp } from "../app/context";
import { AuthService } from "../services/authService";

// ⚠️ Dev-only
const INSTAGRAM_APP_ID = "1112015731097833";
const INSTAGRAM_CLIENT_SECRET = "58e8110c5d6160e7c4501aa829a33cd4";

const SCOPES = [
  "instagram_business_basic",
  "instagram_business_content_publish",
  "instagram_business_manage_comments",
  "instagram_business_manage_insights",
];

WebBrowser.maybeCompleteAuthSession();

const EXPO_USERNAME = "gks2331";
const APP_SLUG = "insta-reach-tracker";
const MANUAL_PROXY = `https://auth.expo.io/@${EXPO_USERNAME}/${APP_SLUG}`;

export default function LoginButton({ onLogin }) {
  const { setAccessToken } = useApp();
  const [loading, setLoading] = useState(false);
  const [resultState, setResultState] = useState(null);
  const [manualUrl, setManualUrl] = useState("");
  const [debugReturnedUrl, setDebugReturnedUrl] = useState(null);

  const finalRedirect = MANUAL_PROXY;

  useEffect(() => {
    console.log("🔗 finalRedirect (forced):", finalRedirect);

    // Setup deep link listener (auto detect on return)
    const handleDeepLink = ({ url }) => {
      console.log("📥 Deep link event received:", url);
      setDebugReturnedUrl(url);
      const { code, error } = parseAuthUrl(url);
      if (error) {
        console.error("⚠️ Deep link contained error:", error);
        setResultState({ error, raw: url });
        return;
      }
      if (code) {
        console.log("✅ Code extracted from deep link:", code);
        exchangeAndSave(code);
      }
    };

    const sub = Linking.addEventListener("url", handleDeepLink);
    return () => {
      console.log("🧹 Removing deep link listener");
      sub.remove();
    };
  }, []);

  function parseAuthUrl(returnedUrl) {
    console.log("📥 Parsing returned URL:", returnedUrl);
    if (!returnedUrl) return { code: null, error: "no_url" };

    try {
      const u = new URL(returnedUrl);
      return {
        code: u.searchParams.get("code"),
        error: u.searchParams.get("error"),
        error_description: u.searchParams.get("error_description"),
      };
    } catch (e) {
      console.warn("⚠️ parseAuthUrl failed:", e);
      return { code: null, error: "parse_failed" };
    }
  }

  async function exchangeAndSave(code) {
    console.log("🔑 Exchanging code for token:", code);
    const tokenInfo = await exchangeCodeForToken(code, finalRedirect);
    console.log("✅ Token info received:", tokenInfo);

    if (tokenInfo?.access_token) {
      await AuthService.saveTokenInfo(tokenInfo);
      setAccessToken(tokenInfo.access_token);
      if (typeof onLogin === "function") onLogin(tokenInfo.access_token, tokenInfo);
      setResultState({ success: true, tokenInfo });
    } else {
      setResultState({ error: "No access_token in token response", raw: tokenInfo });
    }
  }

  async function handleLogin() {
    setResultState(null);
    setDebugReturnedUrl(null);

    const scopeParam = encodeURIComponent(SCOPES.join(","));
    const authUrl = `https://www.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(
      finalRedirect
    )}&scope=${scopeParam}&response_type=code`;

    try {
      setLoading(true);
      console.log("🚀 Launching OAuth with:", authUrl);

      if (Platform.OS === "web") {
        console.log("🌍 Running on web → redirecting browser to authUrl");
        window.location.href = authUrl;
        return;
      }

      const webResult = await WebBrowser.openAuthSessionAsync(authUrl, finalRedirect);
      console.log("🌐 WebBrowser result:", webResult);

      if (webResult?.type === "success" && webResult.url) {
        console.log("✅ Got URL from WebBrowser:", webResult.url);
        setDebugReturnedUrl(webResult.url);
        const { code, error } = parseAuthUrl(webResult.url);
        if (error || !code) {
          setResultState({ error: error || "Code missing", raw: webResult.url });
          return;
        }
        await exchangeAndSave(code);
      } else {
        console.warn("⚠️ No URL returned (type:", webResult?.type, ")");
        Alert.alert(
          "Manual Step",
          "Login finished in browser but no URL was returned. Please copy the final redirect URL and paste it below."
        );
      }
    } catch (err) {
      console.error("💥 Login error:", err);
      setResultState({ error: err.message || String(err) });
    } finally {
      setLoading(false);
    }
  }

  async function handleManualPaste() {
    console.log("📋 Manual paste submitted:", manualUrl);
    const { code, error } = parseAuthUrl(manualUrl);
    if (error || !code) {
      console.error("❌ Invalid manual URL, code missing");
      Alert.alert("Error", "Invalid redirect URL or missing code.");
      return;
    }
    await exchangeAndSave(code);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Loading..." : "Login with Instagram"}</Text>
      </TouchableOpacity>

      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#4267B2" />
        </View>
      )}

      {/* Manual paste fallback */}
      <View style={{ marginTop: 20 }}>
        <Text style={{ fontWeight: "600", marginBottom: 8 }}>
          If login closed without returning:
        </Text>
        <TextInput
          placeholder="Paste full redirect URL here"
          style={styles.input}
          value={manualUrl}
          onChangeText={setManualUrl}
        />
        <TouchableOpacity style={styles.smallButton} onPress={handleManualPaste}>
          <Text style={styles.smallButtonText}>Submit Redirect URL</Text>
        </TouchableOpacity>
      </View>

      {/* Debugging info */}
      {debugReturnedUrl && (
        <View style={{ marginTop: 12 }}>
          <Text style={{ fontWeight: "600" }}>Returned URL:</Text>
          <Text selectable>{debugReturnedUrl}</Text>
        </View>
      )}
      {resultState && (
        <View style={{ marginTop: 16 }}>
          <Text>Result:</Text>
          <Text selectable>{JSON.stringify(resultState, null, 2)}</Text>
        </View>
      )}
    </ScrollView>
  );
}

// -------- token exchange --------
async function exchangeCodeForToken(code, redirectUri) {
  console.log("🔑 Requesting short-lived token with code:", code);
  const body = new URLSearchParams({
    client_id: INSTAGRAM_APP_ID,
    client_secret: INSTAGRAM_CLIENT_SECRET,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  }).toString();

  const res = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const json = await res.json();
  console.log("📦 Short-lived token response:", json);

  if (!json.access_token) {
    throw new Error("Failed to exchange code: " + JSON.stringify(json));
  }

  let finalTokenInfo = { ...json };

  try {
    console.log("🔄 Requesting long-lived token...");
    const longRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${INSTAGRAM_CLIENT_SECRET}&access_token=${json.access_token}`
    );
    const longJson = await longRes.json();
    console.log("📦 Long-lived token response:", longJson);

    if (longJson.access_token) {
      finalTokenInfo = {
        ...finalTokenInfo,
        access_token: longJson.access_token,
        expires_in: longJson.expires_in,
      };
    }
  } catch (err) {
    console.warn("⚠️ Long token exchange failed, using short token:", err);
  }

  return finalTokenInfo;
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#4267B2",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "600" },
  loader: { marginTop: 16, alignItems: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  smallButton: {
    backgroundColor: "#4267B2",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  smallButtonText: { color: "white", fontWeight: "600" },
});
