// screens/LoginScreen.js
import axios from "axios";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import LoginButton from "../components/LoginButton";

export default function LoginScreen({ setAccessToken, setMedia }) {
  const handleLogin = async (token) => {
    setAccessToken(token);

    // Optional: fetch media immediately
    try {
      const pagesRes = await axios.get(
        `https://graph.facebook.com/me/accounts?access_token=${token}`
      );
      const pageId = pagesRes.data.data[0]?.id;
      if (!pageId) return;

      const igRes = await axios.get(
        `https://graph.facebook.com/${pageId}?fields=instagram_business_account&access_token=${token}`
      );
      const igUserId = igRes.data.instagram_business_account?.id;
      if (!igUserId) return;

      const mediaRes = await axios.get(
        `https://graph.facebook.com/${igUserId}/media?fields=id,caption,media_type,media_url,timestamp&access_token=${token}`
      );

      setMedia(mediaRes.data.data.slice(0, 5)); // save first 5 posts
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Instagram Reach Tracker</Text>
        <Text style={styles.subtitle}>Connect your Facebook account to analyze your Instagram insights</Text>
        <LoginButton onLogin={handleLogin} />
        <TouchableOpacity onPress={() => Linking.openURL('https://www.facebook.com/login/identify/')}>
          <Text style={styles.forgotPassword}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  card: {
    backgroundColor: "white",
    padding: 30,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    alignItems: "center",
    width: "80%",
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
    lineHeight: 22,
  },
  forgotPassword: {
    fontSize: 14,
    color: "#4267B2",
    marginTop: 20,
    textDecorationLine: "underline",
  },
});
