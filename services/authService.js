// services/AuthService.js
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "instagram_access_token";
const TOKEN_EXPIRES_AT = "instagram_token_expires_at";

export const AuthService = {
  async saveToken(token, expiresInSeconds = null) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    if (expiresInSeconds) {
      const expiresAt = Date.now() + expiresInSeconds * 1000;
      await SecureStore.setItemAsync(TOKEN_EXPIRES_AT, String(expiresAt));
    } else {
      await SecureStore.deleteItemAsync(TOKEN_EXPIRES_AT);
    }
  },

  async getToken() {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const expiresAt = await SecureStore.getItemAsync(TOKEN_EXPIRES_AT);
    if (!token) return null;
    if (expiresAt && Date.now() > Number(expiresAt)) {
      // token expired
      await this.clearToken();
      return null;
    }
    return token;
  },

  async clearToken() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(TOKEN_EXPIRES_AT);
  },
};
