// screens/LoginScreen.js
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import LoginButton from "../components/LoginButton";

export default function LoginScreen({ setAccessToken, setMedia }) {
  // Facebook login handler (legacy — keep if you still use it)
  const handleFacebookLogin = async (token) => {
    setAccessToken(token);
    // ...existing Facebook logic (optional)
  };

  // Instagram login handler (called after successful login in LoginButton)
  const handleInstagramLogin = async (token) => {
    setAccessToken(token);
    // Optionally, fetch Instagram user media directly here if needed
    // e.g. call your ApiService to populate setMedia(...)
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Instagram Reach Tracker</Text>
        <Text style={styles.subtitle}>
          Connect your account to analyze your Instagram insights
        </Text>

        {/* Single Instagram login button (use the component in components/LoginButton) */}
        <LoginButton onLogin={handleInstagramLogin} />

        <TouchableOpacity
          onPress={() => Linking.openURL("https://www.facebook.com/login/identify/")}
        >
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
    backgroundColor: "#fff",
    padding: 20,
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
