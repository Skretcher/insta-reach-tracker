// services/apiService.js
// Helper layer for Instagram Graph / Facebook Graph calls.

const GRAPH_BASE = "https://graph.facebook.com/v20.0"; // pin to version

async function fetchJson(url) {
  const res = await fetch(url);
  const json = await res.json();
  if (!json) throw new Error(`Empty response from ${url}`);
  if (json.error) {
    const { message, code, type, fbtrace_id } = json.error;
    throw new Error(
      `Graph API error on ${url}: ${message} (code ${code}, type ${type}, trace ${fbtrace_id})`
    );
  }
  return json;
}

/**
 * GET /me/accounts — list of FB pages user has access to
 */
export async function getPages(accessToken) {
  const url = `${GRAPH_BASE}/me/accounts?access_token=${encodeURIComponent(accessToken)}`;
  return fetchJson(url);
}

/**
 * GET /{pageId}?fields=instagram_business_account
 * Returns IG Business account ID linked to FB Page
 */
export async function getIgUserIdFromPage(pageId, accessToken) {
  const url = `${GRAPH_BASE}/${pageId}?fields=instagram_business_account&access_token=${encodeURIComponent(accessToken)}`;
  const json = await fetchJson(url);
  return json.instagram_business_account?.id ?? null;
}

/**
 * GET /{igUserId}/media — list of IG posts
 * If fetchAll=true, follows paging until exhausted.
 */
export async function getMedia(igUserId, accessToken, limit = 25, fetchAll = false) {
  const fields = ["id", "caption", "media_type", "media_url", "permalink", "timestamp"].join(",");
  let url = `${GRAPH_BASE}/${igUserId}/media?fields=${encodeURIComponent(fields)}&limit=${limit}&access_token=${encodeURIComponent(accessToken)}`;
  let allData = [];

  while (url) {
    const json = await fetchJson(url);
    allData = allData.concat(json.data || []);
    if (fetchAll && json.paging?.next) {
      url = json.paging.next;
    } else {
      url = null;
    }
  }
  return allData;
}

/**
 * GET /{nodeId}?fields=field1,field2
 * Can fetch for IG user or media node.
 */
export async function getMediaFields(nodeId, accessToken, fields = []) {
  const fieldStr = Array.isArray(fields) ? fields.join(",") : fields;
  const url = `${GRAPH_BASE}/${nodeId}?fields=${encodeURIComponent(fieldStr)}&access_token=${encodeURIComponent(accessToken)}`;
  return fetchJson(url);
}

/**
 * GET /{mediaId}/insights?metric=impressions,reach
 */
export async function getMediaInsights(mediaId, accessToken, metrics = []) {
  const metricStr = Array.isArray(metrics) ? metrics.join(",") : metrics;
  const url = `${GRAPH_BASE}/${mediaId}/insights?metric=${encodeURIComponent(metricStr)}&access_token=${encodeURIComponent(accessToken)}`;
  return fetchJson(url);
}

/**
 * GET /{igUserId}?fields=username
 * Convenience helper for username.
 */
export async function getIgUsername(igUserId, accessToken) {
  const json = await getMediaFields(igUserId, accessToken, ["username"]);
  return json.username || null;
}
