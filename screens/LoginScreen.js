// screens/LoginScreen.js
import { useState } from "react";
import { ActivityIndicator, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../hooks/useAuth";

export default function LoginScreen({ navigation }) {
  const [manualUrl, setManualUrl] = useState("");
  const handleLoginSuccess = async (token, igBusinessAccountId) => {
    // Navigate to HomeScreen with accessToken and igBusinessAccountId as route params
    navigation.navigate('Home', { accessToken: token, igBusinessAccountId });
  };

  const { login, loading, handleManualUrl } = useAuth({ onLogin: handleLoginSuccess });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Instagram Reach Tracker</Text>
        <Text style={styles.subtitle}>
          Connect your account to analyze your insights.
          {"\n\n"}
          <Text style={styles.note}>
            (Both options use Facebook to securely log you in, which is required by Meta to access Instagram Business data.)
          </Text>
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#4267B2" style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.fbButton]} onPress={login}><Text style={styles.buttonText}>Login Through Facebook</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.igButton]} onPress={login}><Text style={styles.buttonText}>Login Through Instagram</Text></TouchableOpacity>
          </View>
        )}

        {/* Manual paste fallback */}
        <View style={styles.manualContainer}>
          <Text style={styles.manualText}>
            If login doesn't return automatically:
          </Text>
          <TextInput
            placeholder="Paste full redirect URL here"
            style={styles.input}
            value={manualUrl}
            onChangeText={setManualUrl}
          />
          <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={() => handleManualUrl(manualUrl)} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? "Submitting..." : "Submit Redirect URL"}</Text>
          </TouchableOpacity>
        </View>
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
  note: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    width: '100%',
    marginBottom: 10,
  },
  fbButton: {
    backgroundColor: "#4267B2",
  },
  igButton: {
    backgroundColor: "#C13584", // Instagram-like color
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600"
  },
  manualContainer: {
    width: '100%',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  manualText: {
    fontWeight: "600",
    marginBottom: 8,
    textAlign: 'center',
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#555',
  },
  forgotPassword: {
    fontSize: 14,
    color: "#4267B2",
    marginTop: 20,
    textDecorationLine: "underline",
  },
});
