// components/LoginButton.js
import Constants from "expo-constants";
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

const INSTAGRAM_APP_ID = Constants.expoConfig.extra.instagramAppId;
const INSTAGRAM_CLIENT_SECRET = Constants.expoConfig.extra.instagramClientSecret;

const SCOPES = [
  // Required for fetching IG User ID via a FB Page
  "pages_show_list",
  "pages_read_engagement",
  // Instagram permissions
  "instagram_basic",
  "instagram_manage_insights",
  "instagram_content_publish",
  "instagram_manage_comments",
];

WebBrowser.maybeCompleteAuthSession();

const EXPO_USERNAME = "gks2331";
const APP_SLUG = "instareachtracker";
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
      // Fetch the Instagram Business Account ID
      const igBusinessAccountId = await getInstagramBusinessAccountId(tokenInfo.access_token);
      console.log("✅ Instagram Business Account ID:", igBusinessAccountId);
      // --- New Debugging Step ---
      await debugAccessToken(tokenInfo.access_token);
      // --------------------------
      console.log("LoginButton: igBusinessAccountId after getInstagramBusinessAccountId:", igBusinessAccountId);

      await AuthService.saveTokenInfo(tokenInfo);
      setAccessToken(tokenInfo.access_token);
      if (typeof onLogin === "function")
        onLogin(tokenInfo.access_token, igBusinessAccountId, tokenInfo);
      setResultState({ success: true, igBusinessAccountId, tokenInfo });
    } else {
      setResultState({ error: "No access_token in token response", raw: tokenInfo });
    }
  }

  async function handleLogin() {
    setResultState(null);
    setDebugReturnedUrl(null);

    // Safeguard to ensure environment variables are loaded
    if (!INSTAGRAM_APP_ID || !INSTAGRAM_CLIENT_SECRET) {
      const errorMessage =
        "App ID or Client Secret is missing. Please check your .env file and restart the server with 'npx expo start -c'.";
      console.error("❌ CONFIGURATION ERROR:", errorMessage);
      Alert.alert("Configuration Error", errorMessage);
      return;
    }

    const scopeParam = encodeURIComponent(SCOPES.join(","));
    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(finalRedirect)}&scope=${scopeParam}&response_type=code&state=123&auth_type=reauthenticate`; // state is recommended

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
    setLoading(true);
    try {
      console.log("📋 Manual paste submitted:", manualUrl);
      const { code, error } = parseAuthUrl(manualUrl);
      if (error || !code) {
        console.error("❌ Invalid manual URL, code missing");
        Alert.alert("Error", "Invalid redirect URL or missing code. Please paste the full URL from the browser address bar.");
        return;
      }
      await exchangeAndSave(code);
      setManualUrl(""); // Clear input on success
    } catch (err) {
      console.error("💥 Manual paste error:", err);
      setResultState({ error: err.message || String(err) });
      Alert.alert("Submission Failed", "An error occurred: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
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
        <TouchableOpacity style={styles.smallButton} onPress={handleManualPaste} disabled={loading}>
          <Text style={styles.smallButtonText}>{loading ? "Submitting..." : "Submit Redirect URL"}</Text>
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

  const res = await fetch("https://graph.facebook.com/v19.0/oauth/access_token", {
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
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${INSTAGRAM_APP_ID}&client_secret=${INSTAGRAM_CLIENT_SECRET}&fb_exchange_token=${json.access_token}`
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

// -------- Get Instagram Business Account ID --------
async function getInstagramBusinessAccountId(userAccessToken) {
  console.log("🔎 Fetching Facebook Pages connected to the user...");
  // We ask for the instagram_business_account directly in the first call
  const accountsUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=name,instagram_business_account{id}&access_token=${userAccessToken}`;

  try {
    const accountsRes = await fetch(accountsUrl);
    const accountsJson = await accountsRes.json();
    console.log("📦 Facebook Pages response:", accountsJson);

    if (accountsJson.error) {
      console.error("❌ Error fetching Facebook pages:", accountsJson.error);
      throw new Error("Failed to fetch Facebook pages: " + accountsJson.error.message);
    }
    
    // Find the first page that has an instagram_business_account linked
    const pageWithIg = accountsJson.data?.find(page => page.instagram_business_account);

    if (pageWithIg) {
      const igAccountId = pageWithIg.instagram_business_account.id;
      console.log(`✅ Found Instagram Business Account ID: ${igAccountId} for Page "${pageWithIg.name}".`);
      return igAccountId;
    }
  } catch (err) {
    console.error("❌ Network or parsing error fetching Facebook pages:", err);
    throw new Error("Network or parsing error fetching Facebook pages: " + err.message);
  }

  console.warn("⚠️ Loop finished: No Instagram Business Account found linked to any of the user's Facebook Pages.");
  Alert.alert("No Instagram Account", "Could not find an Instagram Business Account connected to your Facebook Pages.");
  return null;
}

// -------- New Debugging Function --------
async function debugAccessToken(userAccessToken) {
  console.log("🔬 Debugging Access Token...");
  const debugUrl = `https://graph.facebook.com/debug_token?input_token=${userAccessToken}&access_token=${INSTAGRAM_APP_ID}|${INSTAGRAM_CLIENT_SECRET}`;

  try {
    const res = await fetch(debugUrl);
    const json = await res.json();
    console.log("📦 Access Token Debugger Response:", JSON.stringify(json, null, 2));

    if (json.data?.error) {
      console.error("❌ Token Debug Error:", json.data.error);
    }
    if (!json.data?.scopes?.includes("instagram_basic")) {
      console.warn("⚠️ CRITICAL: Token is missing 'instagram_basic' scope!");
    }
    if (!json.data?.scopes?.includes("pages_show_list")) {
      console.warn("⚠️ CRITICAL: Token is missing 'pages_show_list' scope!");
    }
  } catch (err) {
    console.error("💥 Failed to debug access token:", err);
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
