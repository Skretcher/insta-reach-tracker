// screens/HomeScreen.js
import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import MediaList from "../components/MediaList";
import { ApiService } from "../services/apiService";
import { AuthService } from "../services/authService";

export default function HomeScreen({ navigation, accessToken, setAccessToken }) {
  const [media, setMedia] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Filter media by caption
  const filteredMedia = media.filter((item) =>
    item.caption?.toLowerCase().includes(search.toLowerCase())
  );

  const handleRefresh = async () => {
    if (!accessToken) {
      Alert.alert("Error", "No access token found.");
      return;
    }

    setLoading(true);
    try {
      // 1) Get Facebook Pages for the user
      const pagesRes = await ApiService.getPages(accessToken);
      const pages = pagesRes?.data ?? [];
      if (!pages.length) throw new Error("No Facebook Pages linked to your account.");

      // Use first page (or pick the page that has ig business connected)
      const page = pages[0];
      const pageId = page.id;

      // 2) Get instagram_business_account id from page
      const igUserId = await ApiService.getIgUserIdFromPage(pageId, accessToken);
      if (!igUserId) throw new Error("No Instagram Business Account linked to this page.");

      // 3) Get media list. Request like_count & comments_count fields for totals.
      // ApiService.getMedia should accept a fields override or you can adjust it; here we call the API directly via wrapper.
      const mediaRes = await ApiService.getMedia(igUserId, accessToken, 50);
      const posts = mediaRes?.data ?? [];

      // 4) For each post, fetch insights (impressions,reach,engagement,saved)
      const postsWithInsights = await Promise.all(
        posts.map(async (post) => {
          // Ensure we have like_count & comments_count on the media object:
          // If ApiService.getMedia does not request them, we can fetch the media fields
          let enriched = { ...post };
          try {
            // Fetch insights for metrics we care about
            const insightsRes = await ApiService.getMediaInsights(post.id, accessToken, [
              "impressions",
              "reach",
              "engagement",
              "saved",
            ]);

            // Transform into easy lookup
            const insightsObj = {};
            (insightsRes?.data ?? []).forEach((m) => {
              // metric objects typically look like { name: 'impressions', values: [{ value: 123 }], ... }
              insightsObj[m.name] = m.values?.[0]?.value ?? 0;
            });

            enriched.insights = insightsObj;
          } catch (err) {
            // Keep going if insight fetch fails for one post
            console.warn("Insight fetch failed for", post.id, err?.message ?? err);
            enriched.insights = enriched.insights ?? {};
          }

          // If like_count or comments_count are not present on the media object, try to fetch them.
          if (enriched.like_count == null || enriched.comments_count == null) {
            try {
              const mediaFieldsRes = await ApiService.getMediaFields(post.id, accessToken, [
                "like_count",
                "comments_count",
                "permalink",
                "media_url",
                "media_type",
                "caption",
                "timestamp",
              ]);
              enriched = { ...enriched, ...mediaFieldsRes };
            } catch (err) {
              // ignore
            }
          }

          // Ensure numeric defaults
          enriched.like_count = Number(enriched.like_count ?? 0);
          enriched.comments_count = Number(enriched.comments_count ?? 0);

          return enriched;
        })
      );

      setMedia(postsWithInsights);
      Alert.alert("Success", `Fetched ${postsWithInsights.length} posts`);
    } catch (err) {
      console.error("Error in handleRefresh:", err);
      Alert.alert("Error", err.message || "Failed to fetch Instagram posts.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AuthService.clearToken();
    } catch (e) {
      console.warn("Failed to clear token:", e);
    }
    setAccessToken(null);
    setMedia([]);
  };

  // Stats (note: totals use like_count/comments_count which are explicit media fields)
  const totalPosts = media.length;
  const totalLikes = media.reduce((sum, m) => sum + (Number(m.like_count) || 0), 0);
  const totalComments = media.reduce((sum, m) => sum + (Number(m.comments_count) || 0), 0);

  // For shares: Instagram doesn't reliably expose a `shares` insight for all media types.
  // We'll aggregate `insights.saved` or `insights.engagement` as a proxy if shares are not available.
  const totalSaved = media.reduce((sum, m) => sum + (Number(m.insights?.saved) || 0), 0);
  const totalEngagement = media.reduce((sum, m) => sum + (Number(m.insights?.engagement) || 0), 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.header}>📊 Instagram Insights</Text>
      <Text style={styles.welcome}>
        Welcome back! Here's your performance overview.
      </Text>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: "#E3F2FD" }]}>
          <Text style={styles.statIcon}>📸</Text>
          <Text style={styles.statNumber}>{totalPosts}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: "#FCE4EC" }]}>
          <Text style={styles.statIcon}>❤️</Text>
          <Text style={styles.statNumber}>{totalLikes}</Text>
          <Text style={styles.statLabel}>Likes</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: "#F3E5F5" }]}>
          <Text style={styles.statIcon}>💬</Text>
          <Text style={styles.statNumber}>{totalComments}</Text>
          <Text style={styles.statLabel}>Comments</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: "#E8F5E8" }]}>
          <Text style={styles.statIcon}>🔖</Text>
          <Text style={styles.statNumber}>{totalSaved}</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
      </View>

      {/* Recent Posts */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>📈 Recent Posts</Text>

        {/* Search bar */}
        <TextInput
          style={styles.searchBox}
          placeholder="Search posts by caption..."
          value={search}
          onChangeText={setSearch}
        />

        {loading ? (
          <View style={{ padding: 20, alignItems: "center" }}>
            <ActivityIndicator size="large" />
            <Text style={{ marginTop: 8 }}>Refreshing posts…</Text>
          </View>
        ) : (
          <MediaList
            media={filteredMedia}
            onSelect={(item) => navigation.navigate("MediaDetail", { item })}
          />
        )}
      </View>

      {/* Buttons */}
      <TouchableOpacity
        style={[styles.refreshButton, loading && { opacity: 0.7 }]}
        onPress={handleRefresh}
        disabled={loading}
      >
        <Text style={styles.refreshButtonText}>
          {loading ? "⏳ Refreshing..." : "🔄 Refresh Data"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>🚪 Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  contentContainer: { padding: 20, paddingBottom: 40 },
  header: { fontSize: 28, fontWeight: "bold", color: "#2c3e50", textAlign: "center", marginBottom: 10 },
  welcome: { fontSize: 16, color: "#7f8c8d", textAlign: "center", marginBottom: 30, lineHeight: 22 },
  statsContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30, flexWrap: "wrap" },
  statCard: { backgroundColor: "white", padding: 20, borderRadius: 15, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5, width: "22%", minWidth: 80, marginBottom: 10 },
  statIcon: { fontSize: 24, marginBottom: 8 },
  statNumber: { fontSize: 20, fontWeight: "bold", color: "#2c3e50" },
  statLabel: { fontSize: 14, color: "#7f8c8d", marginTop: 5, fontWeight: "500" },
  section: { marginBottom: 30 },
  sectionHeader: { fontSize: 22, fontWeight: "bold", color: "#34495e", marginBottom: 15 },
  searchBox: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 15, backgroundColor: "#fff" },
  refreshButton: { backgroundColor: "#3498db", paddingVertical: 15, paddingHorizontal: 30, borderRadius: 25, alignSelf: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5 },
  refreshButtonText: { color: "white", fontSize: 16, fontWeight: "bold", textAlign: "center" },
  logoutButton: { backgroundColor: "#e74c3c", paddingVertical: 15, paddingHorizontal: 30, borderRadius: 25, alignSelf: "center", marginTop: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6 },
  logoutButtonText: { color: "white", fontSize: 16, fontWeight: "bold", textAlign: "center" },
});
