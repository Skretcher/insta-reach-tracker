// services/authService.js
// Minimal token persistence using AsyncStorage for dev.
// Replace with SecureStore / backend in production.

import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_TOKEN = "ig_access_token";

export const AuthService = {
  async saveToken(token) {
    try {
      await AsyncStorage.setItem(KEY_TOKEN, token);
    } catch (e) {
      console.warn("AuthService.saveToken failed", e);
    }
  },
  async getToken() {
    try {
      return await AsyncStorage.getItem(KEY_TOKEN);
    } catch (e) {
      console.warn("AuthService.getToken failed", e);
      return null;
    }
  },
  async clearToken() {
    try {
      await AsyncStorage.removeItem(KEY_TOKEN);
    } catch (e) {
      console.warn("AuthService.clearToken failed", e);
    }
  },
};
