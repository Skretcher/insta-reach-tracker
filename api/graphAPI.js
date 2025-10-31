import axios from "axios";

const GRAPH_URL = "https://graph.facebook.com/v19.0";

// 1. Get user profile
export const getUserProfile = async (accessToken) => {
  return axios.get(`${GRAPH_URL}/me?fields=id,name&access_token=${accessToken}`);
};

// 2. Get user’s Facebook pages
export const getUserPages = async (accessToken) => {
  return axios.get(`${GRAPH_URL}/me/accounts?access_token=${accessToken}`);
};

// 3. Get Instagram business account from a Page
export const getInstagramAccount = async (pageId, accessToken) => {
  return axios.get(
    `${GRAPH_URL}/${pageId}?fields=instagram_business_account&access_token=${accessToken}`
  );
};

// 4. Get media list
export const getMedia = async (igUserId, accessToken) => {
  return axios.get(
    `${GRAPH_URL}/${igUserId}/media?fields=id,caption,media_type,media_url,timestamp,permalink,thumbnail_url,like_count,comments_count,insights.metric(impressions,reach,saved)&access_token=${accessToken}`
  );
};

// 5. Get insights for one media
export const getMediaInsights = async (mediaId, accessToken) => {
  return axios.get(
    `${GRAPH_URL}/${mediaId}/insights?metric=engagement,impressions,reach,saved,shares&access_token=${accessToken}`
  );
};

// 6. Get posts for a Facebook Page
export const getPagePosts = async (pageId, accessToken) => {
  return axios.get(
    `${GRAPH_URL}/${pageId}/posts?fields=id,message,created_time,full_picture,permalink_url,insights.metric(post_impressions_unique,post_engaged_users),likes.summary(true),comments.summary(true)&access_token=${accessToken}`
  );
};
