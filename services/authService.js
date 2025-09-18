// services/authService.js
// Minimal token persistence using AsyncStorage for dev.
// ⚠ Replace with SecureStore / backend in production.

import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_TOKEN = "ig_access_token";
const KEY_TOKEN_INFO = "ig_token_info";

export const AuthService = {
  /**
   * Save just the access token (string).
   */
  async saveToken(token) {
    try {
      await AsyncStorage.setItem(KEY_TOKEN, token);
    } catch (e) {
      console.warn("AuthService.saveToken failed", e);
    }
  },

  /**
   * Get just the access token (string).
   */
  async getToken() {
    try {
      return await AsyncStorage.getItem(KEY_TOKEN);
    } catch (e) {
      console.warn("AuthService.getToken failed", e);
      return null;
    }
  },

  /**
   * Clear only the access token.
   */
  async clearToken() {
    try {
      await AsyncStorage.removeItem(KEY_TOKEN);
    } catch (e) {
      console.warn("AuthService.clearToken failed", e);
    }
  },

  /**
   * Save extended token info (useful for debugging/testing).
   * Example object: { access_token, user_id, expires_in }
   */
  async saveTokenInfo(info) {
    try {
      await AsyncStorage.setItem(KEY_TOKEN_INFO, JSON.stringify(info));
      if (info.access_token) {
        await AsyncStorage.setItem(KEY_TOKEN, info.access_token);
      }
    } catch (e) {
      console.warn("AuthService.saveTokenInfo failed", e);
    }
  },

  /**
   * Get token info object.
   */
  async getTokenInfo() {
    try {
      const raw = await AsyncStorage.getItem(KEY_TOKEN_INFO);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn("AuthService.getTokenInfo failed", e);
      return null;
    }
  },

  async clearTokenInfo() {
    try {
      await AsyncStorage.removeItem(KEY_TOKEN_INFO);
      await AsyncStorage.removeItem(KEY_TOKEN);
    } catch (e) {
      console.warn("AuthService.clearTokenInfo failed", e);
    }
  },
};
