// hooks/useAuth.js
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Alert, Platform } from "react-native";
import { AuthService } from "../services/authService";

const INSTAGRAM_APP_ID = Constants.expoConfig.extra.instagramAppId;
const INSTAGRAM_CLIENT_SECRET = Constants.expoConfig.extra.instagramClientSecret;

const SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "instagram_basic",
  "instagram_manage_insights",
  "instagram_content_publish",
  "instagram_manage_comments",
];

WebBrowser.maybeCompleteAuthSession();

const EXPO_USERNAME = "gks2331";
const APP_SLUG = "instareachtracker";
const REDIRECT_URI = `https://auth.expo.io/@${EXPO_USERNAME}/${APP_SLUG}`;

export function useAuth({ onLogin }) {
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setLoading(true);
    try {
      // Safeguard to ensure environment variables are loaded
      if (!INSTAGRAM_APP_ID || !INSTAGRAM_CLIENT_SECRET) {
        const errorMessage =
          "App ID or Client Secret is missing. Please check your .env file and restart the server with 'npx expo start -c'.";
        console.error("❌ CONFIGURATION ERROR:", errorMessage);
        Alert.alert("Configuration Error", errorMessage);
        return;
      }

      const scopeParam = encodeURIComponent(SCOPES.join(","));
      const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
      )}&scope=${scopeParam}&response_type=code&state=123&auth_type=reauthenticate`;

      console.log("🚀 Launching OAuth with:", authUrl);

      if (Platform.OS === "web") {
        window.location.href = authUrl;
        return;
      }

      const webResult = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);
      console.log("🌐 WebBrowser result:", webResult);

      if (webResult?.type === "success" && webResult.url) {
        const { code, error } = parseAuthUrl(webResult.url);
        if (error || !code) {
          Alert.alert("Login Error", `Failed to get authorization code. Error: ${error || "Code missing"}`);
          return;
        }
        await exchangeAndSave(code);
      } else {
        console.warn("⚠️ Login cancelled or failed. Type:", webResult?.type);
      }
    } catch (err) {
      console.error("💥 Login error:", err);
      Alert.alert("Login Error", err.message || "An unknown error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualUrl = async (url) => {
    setLoading(true);
    try {
      console.log("📋 Manual paste submitted:", url);
      const { code, error } = parseAuthUrl(url);
      if (error || !code) {
        Alert.alert("Error", "Invalid redirect URL or missing code. Please paste the full URL from the browser address bar.");
        return;
      }
      await exchangeAndSave(code);
    } catch (err) {
      console.error("💥 Manual paste error:", err);
      Alert.alert("Submission Failed", "An error occurred: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };
  const parseAuthUrl = (returnedUrl) => {
    if (!returnedUrl) return { code: null, error: "no_url" };
    try {
      const u = new URL(returnedUrl);
      return {
        code: u.searchParams.get("code"),
        error: u.searchParams.get("error"),
      };
    } catch (e) {
      return { code: null, error: "parse_failed" };
    }
  };

  const exchangeAndSave = async (code) => {
    console.log("🔑 Exchanging code for token...");
    const tokenInfo = await exchangeCodeForToken(code, REDIRECT_URI);

    if (tokenInfo?.access_token) {
      const igBusinessAccountId = await getInstagramBusinessAccountId(tokenInfo.access_token);
      await debugAccessToken(tokenInfo.access_token);

      await AuthService.saveTokenInfo(tokenInfo);
      if (typeof onLogin === "function") {
        onLogin(tokenInfo.access_token, igBusinessAccountId, tokenInfo);
      }
    } else {
      throw new Error("Failed to get access token from response.");
    }
  };

  return { login, loading, handleManualUrl };
}

// Helper functions (kept outside the hook as they don't depend on state)

async function exchangeCodeForToken(code, redirectUri) {
  console.log("🔑 Requesting short-lived token...");
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
  if (!json.access_token) throw new Error("Failed to exchange code: " + JSON.stringify(json));

  console.log("🔄 Requesting long-lived token...");
  const longRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${INSTAGRAM_APP_ID}&client_secret=${INSTAGRAM_CLIENT_SECRET}&fb_exchange_token=${json.access_token}`
  );
  const longJson = await longRes.json();

  return longJson.access_token ? longJson : json;
}

async function getInstagramBusinessAccountId(userAccessToken) {
  console.log("🔎 Fetching Instagram Business Account ID...");
  const accountsUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=name,instagram_business_account{id}&access_token=${userAccessToken}`;

  try {
    const accountsRes = await fetch(accountsUrl);
    const accountsJson = await accountsRes.json();
    console.log("📦 Facebook Pages response:", accountsJson);

    if (accountsJson.error) throw new Error("Failed to fetch Facebook pages: " + accountsJson.error.message);

    const pageWithIg = accountsJson.data?.find(page => page.instagram_business_account);
    if (pageWithIg) {
      const igAccountId = pageWithIg.instagram_business_account.id;
      console.log(`✅ Found Instagram Business Account ID: ${igAccountId}`);
      return igAccountId;
    }
  } catch (err) {
    console.error("❌ Error in getInstagramBusinessAccountId:", err);
    throw err;
  }

  console.warn("⚠️ No Instagram Business Account found linked to any Facebook Pages.");
  Alert.alert("No Instagram Account", "Could not find an Instagram Business Account connected to any of your Facebook Pages.");
  return null;
}

async function debugAccessToken(userAccessToken) {
  console.log("🔬 Debugging Access Token...");
  const debugUrl = `https://graph.facebook.com/debug_token?input_token=${userAccessToken}&access_token=${INSTAGRAM_APP_ID}|${INSTAGRAM_CLIENT_SECRET}`;

  try {
    const res = await fetch(debugUrl);
    const json = await res.json();
    console.log("📦 Access Token Debugger Response:", JSON.stringify(json.data, null, 2));

    if (json.data?.error) console.error("❌ Token Debug Error:", json.data.error);
    if (!json.data?.scopes?.includes("instagram_basic")) console.warn("⚠️ CRITICAL: Token is missing 'instagram_basic' scope!");
    if (!json.data?.scopes?.includes("pages_show_list")) console.warn("⚠️ CRITICAL: Token is missing 'pages_show_list' scope!");
  } catch (err) {
    console.error("💥 Failed to debug access token:", err);
  }
}