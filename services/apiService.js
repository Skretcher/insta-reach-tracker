// services/apiService.js
// Helper layer for Instagram Graph calls using Instagram-scoped tokens.
// Works with Instagram Business Login (Option A).

const GRAPH_BASE = "https://graph.instagram.com";

async function fetchJson(url) {
  const res = await fetch(url);
  // try to parse JSON even on non-2xx to surface helpful errors
  let json;
  try {
    json = await res.json();
  } catch (e) {
    throw new Error(`Invalid JSON response from ${url}: ${e.message}`);
  }
  if (!json) throw new Error(`Empty response from ${url}`);
  if (json.error) {
    const { message, code, type } = json.error;
    throw new Error(`Graph API error on ${url}: ${message} (code ${code}, type ${type})`);
  }
  return json;
}

/**
 * GET /me — get basic IG user info
 * Example fields: id, username, account_type
 */
export async function getUserProfile(accessToken) {
  const fields = ["id", "username", "account_type"].join(",");
  const url = `${GRAPH_BASE}/me?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(accessToken)}`;
  return fetchJson(url);
}

/**
 * Paginated media fetch helper.
 * If afterUrl is provided, it will fetch that exact URL (returned previously in `next`).
 * Otherwise it requests /me/media with the given limit.
 *
 * Returns: { data: Array, next: string | null }
 */
export async function getMediaPage(accessToken, limit = 20, afterUrl = null) {
  let url = afterUrl;
  if (!url) {
    const fields = ["id", "caption", "media_type", "media_url", "permalink", "timestamp"].join(",");
    url = `${GRAPH_BASE}/me/media?fields=${encodeURIComponent(fields)}&limit=${limit}&access_token=${encodeURIComponent(accessToken)}`;
  }

  const json = await fetchJson(url);
  const data = json.data || [];
  const next = json.paging?.next || null;
  return { data, next };
}

/**
 * Convenience: get all media (non-paged)
 * Existing code sometimes expects either an array or an object with data.
 * This returns an array (first page only unless fetchAll true).
 */
export async function getMedia(accessToken, limit = 25, fetchAll = false) {
  const fields = ["id", "caption", "media_type", "media_url", "permalink", "timestamp"].join(",");
  let url = `${GRAPH_BASE}/me/media?fields=${encodeURIComponent(fields)}&limit=${limit}&access_token=${encodeURIComponent(accessToken)}`;
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
 * GET /{nodeId}?fields=...
 * Can fetch for IG user or media node.
 */
export async function getMediaFields(nodeId, accessToken, fields = []) {
  const fieldStr = Array.isArray(fields) ? fields.join(",") : fields;
  const url = `${GRAPH_BASE}/${nodeId}?fields=${encodeURIComponent(fieldStr)}&access_token=${encodeURIComponent(accessToken)}`;
  return fetchJson(url);
}

/**
 * GET /{mediaId}/insights?metric=...
 * Fetch insights for a media node. Metrics depend on media type and account type.
 */
export async function getMediaInsights(mediaId, accessToken, metrics = []) {
  const metricStr = Array.isArray(metrics) ? metrics.join(",") : metrics;
  const url = `${GRAPH_BASE}/${mediaId}/insights?metric=${encodeURIComponent(metricStr)}&access_token=${encodeURIComponent(accessToken)}`;
  return fetchJson(url);
}
