// services/ApiService.js
import axios from "axios";

const GRAPH_BASE = "https://graph.facebook.com/v17.0"; // stable version

export const ApiService = {
  // Get Facebook Pages for the user
  async getPages(userAccessToken) {
    const res = await axios.get(`${GRAPH_BASE}/me/accounts`, {
      params: { access_token: userAccessToken },
    });
    return res.data; // { data: [...] }
  },

  // Get IG Business account from a Page
  async getIgUserIdFromPage(pageId, accessToken) {
    const res = await axios.get(`${GRAPH_BASE}/${pageId}`, {
      params: { fields: "instagram_business_account", access_token },
    });
    return res.data?.instagram_business_account?.id || null;
  },

  // Get media list for an IG user
  async getMedia(igUserId, accessToken, limit = 25) {
    const fields = [
      "id",
      "caption",
      "media_url",
      "media_type",
      "timestamp",
      "permalink",
      "like_count",
      "comments_count",
    ].join(",");

    const res = await axios.get(`${GRAPH_BASE}/${igUserId}/media`, {
      params: { fields, limit, access_token: accessToken },
    });
    return res.data; // { data: [...] }
  },

  // Get insights for a media item
  async getMediaInsights(mediaId, accessToken, metrics = ["impressions","reach","engagement","saved"]) {
    const res = await axios.get(`${GRAPH_BASE}/${mediaId}/insights`, {
      params: { metric: metrics.join(","), access_token: accessToken },
    });
    return res.data; // { data: [...] }
  },

  // Get specific fields for a single media item (fallback)
  async getMediaFields(mediaId, accessToken, fields = ["like_count","comments_count"]) {
    const res = await axios.get(`${GRAPH_BASE}/${mediaId}`, {
      params: { fields: fields.join(","), access_token: accessToken },
    });
    return res.data; // object with requested fields
  },
};
