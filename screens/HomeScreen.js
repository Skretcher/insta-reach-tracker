// screens/HomeScreen.js
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useApp } from "../app/context";
import MediaList from "../components/MediaList";
import * as ApiService from "../services/apiService";
import { AuthService } from "../services/authService";

export default function HomeScreen({ navigation }) {
  const { accessToken, setAccessToken, media, setMedia } = useApp();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [username, setUsername] = useState("");
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const PAGE_SIZE = 20;

  // Redirect to login if no token
  useEffect(() => {
    if (!accessToken) {
      navigation.replace("Login");
    }
  }, [accessToken, navigation]);

  // Auto refresh when token first appears
  useEffect(() => {
    if (accessToken) {
      const t = setTimeout(() => {
        handleRefresh().catch((e) => console.warn("Auto refresh failed", e));
      }, 500);
      return () => clearTimeout(t);
    }
  }, [accessToken]);

  // Filter media by caption safely
  const filteredMedia = useMemo(
    () =>
      (media || []).filter((item) =>
        item.caption?.toLowerCase().includes(search.toLowerCase())
      ),
    [media, search]
  );

  // Helper: Enrich a single post (insights + fields)
  const enrichPost = async (post, token) => {
    let enriched = { ...post };
    try {
      const insightsRes = await ApiService.getMediaInsights(post.id, token, [
        "impressions",
        "reach",
        "engagement",
        "saved",
      ]);
      const insightsObj = {};
      (insightsRes?.data ?? []).forEach((m) => {
        insightsObj[m.name] = m.values?.[0]?.value ?? 0;
      });
      enriched.insights = insightsObj;
    } catch {
      enriched.insights = enriched.insights ?? {};
    }

    if (enriched.like_count == null || enriched.comments_count == null) {
      try {
        const mediaFieldsRes = await ApiService.getMediaFields(
          post.id,
          token,
          [
            "like_count",
            "comments_count",
            "permalink",
            "media_url",
            "media_type",
            "caption",
            "timestamp",
          ]
        );
        enriched = { ...enriched, ...mediaFieldsRes };
      } catch {}
    }

    enriched.like_count = Number(enriched.like_count ?? 0);
    enriched.comments_count = Number(enriched.comments_count ?? 0);
    return enriched;
  };

  // Fetch username and first page of media
  const handleRefresh = async () => {
    if (!accessToken) {
      Alert.alert("Error", "No access token found.");
      return;
    }

    setLoading(true);
    setNextPageUrl(null);
    try {
      // Profile
      try {
        const user = await ApiService.getUserProfile(accessToken);
        setUsername(user.username || "");
      } catch {
        setUsername("");
      }

      // Try to use paged endpoint if available
      if (typeof ApiService.getMediaPage === "function") {
        // getMediaPage should return { data, next }
        const page = await ApiService.getMediaPage(accessToken, PAGE_SIZE);
        const rawPosts = page.data || [];
        setNextPageUrl(page.next || null);

        // Enrich page posts
        const postsWithInsights = await Promise.all(
          rawPosts.map((p) => enrichPost(p, accessToken))
        );

        setMedia(postsWithInsights);
        Alert.alert("Success", `Fetched ${postsWithInsights.length} posts (page).`);
      } else {
        // Fallback: existing getMedia (non-paged) - keep previous behavior
        const posts = await ApiService.getMedia(accessToken, PAGE_SIZE);
        const rawPosts = Array.isArray(posts) ? posts : posts?.data ?? [];
        const postsWithInsights = await Promise.all(
          rawPosts.map((p) => enrichPost(p, accessToken))
        );

        setMedia(postsWithInsights);
        Alert.alert("Success", `Fetched ${postsWithInsights.length} posts.`);
      }
    } catch (err) {
      console.error("Error in handleRefresh:", err);
      Alert.alert("Error", err.message || "Failed to fetch Instagram posts.");
    } finally {
      setLoading(false);
    }
  };

  // Load more pages (when user presses Load more)
  const handleLoadMore = async () => {
    if (!accessToken) {
      Alert.alert("Error", "No access token found.");
      return;
    }
    if (!nextPageUrl) return;

    setLoadingMore(true);
    try {
      if (typeof ApiService.getMediaPage === "function") {
        const page = await ApiService.getMediaPage(accessToken, PAGE_SIZE, nextPageUrl);
        const rawPosts = page.data || [];
        const postsWithInsights = await Promise.all(
          rawPosts.map((p) => enrichPost(p, accessToken))
        );

        // Append new posts
        setMedia((prev) => [...(prev || []), ...postsWithInsights]);
        setNextPageUrl(page.next || null);
      } else {
        // If no paged API exists, fallback to nothing (or optionally re-run getMedia with larger limit)
        Alert.alert("No paging API available", "Server-side paging is not configured.");
        setNextPageUrl(null);
      }
    } catch (err) {
      console.error("Error loading more:", err);
      Alert.alert("Error", err.message || "Failed to load more posts.");
    } finally {
      setLoadingMore(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await AuthService.clearTokenInfo();
    } catch (e) {
      console.warn("Failed to clear token:", e);
    }
    setAccessToken(null);
    setMedia([]);
  };

  // Stats calculation with useMemo
  const stats = useMemo(
    () => ({
      totalPosts: media?.length || 0,
      totalLikes:
        media?.reduce((sum, m) => sum + (Number(m.like_count) || 0), 0) || 0,
      totalComments:
        media?.reduce((sum, m) => sum + (Number(m.comments_count) || 0), 0) || 0,
      totalSaved:
        media?.reduce((sum, m) => sum + (Number(m.insights?.saved) || 0), 0) || 0,
      totalEngagement:
        media?.reduce((sum, m) => sum + (Number(m.insights?.engagement) || 0), 0) || 0,
    }),
    [media]
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.header}>📊 Instagram Insights</Text>
      <Text style={styles.welcome}>
        Welcome back! Here's your performance overview.
      </Text>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: "#E3F2FD" }]}>
          <Text style={styles.statIcon}>📸</Text>
          <Text style={styles.statNumber}>{stats.totalPosts}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: "#FCE4EC" }]}>
          <Text style={styles.statIcon}>❤️</Text>
          <Text style={styles.statNumber}>{stats.totalLikes}</Text>
          <Text style={styles.statLabel}>Likes</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: "#F3E5F5" }]}>
          <Text style={styles.statIcon}>💬</Text>
          <Text style={styles.statNumber}>{stats.totalComments}</Text>
          <Text style={styles.statLabel}>Comments</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: "#E8F5E8" }]}>
          <Text style={styles.statIcon}>🔖</Text>
          <Text style={styles.statNumber}>{stats.totalSaved}</Text>
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
          <>
            <MediaList
              media={filteredMedia}
              onSelect={(item) => navigation.navigate("MediaDetail", { id: item.id })}
            />

            {/* Load more button if we have a next page */}
            {nextPageUrl ? (
              <TouchableOpacity
                style={[styles.loadMoreButton, loadingMore && { opacity: 0.7 }]}
                onPress={handleLoadMore}
                disabled={loadingMore}
              >
                <Text style={styles.loadMoreText}>
                  {loadingMore ? "Loading more…" : "Load more posts"}
                </Text>
              </TouchableOpacity>
            ) : null}
          </>
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

      {username ? (
        <Text
          style={{
            textAlign: "center",
            marginTop: 30,
            color: "#888",
            fontSize: 16,
          }}
        >
          Logged in as{" "}
          <Text style={{ fontWeight: "bold", color: "#222" }}>{username}</Text>
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  contentContainer: { padding: 20, paddingBottom: 40 },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2c3e50",
    textAlign: "center",
    marginBottom: 10,
  },
  welcome: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    flexWrap: "wrap",
  },
  statCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    width: "22%",
    minWidth: 80,
    marginBottom: 10,
  },
  statIcon: { fontSize: 24, marginBottom: 8 },
  statNumber: { fontSize: 20, fontWeight: "bold", color: "#2c3e50" },
  statLabel: { fontSize: 14, color: "#7f8c8d", marginTop: 5, fontWeight: "500" },
  section: { marginBottom: 30 },
  sectionHeader: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#34495e",
    marginBottom: 15,
  },
  searchBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  loadMoreButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 12,
    paddingHorizontal: 20,
  },
  loadMoreText: {
    color: "#333",
    fontWeight: "600",
  },
  refreshButton: {
    backgroundColor: "#3498db",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  refreshButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  logoutButton: {
    backgroundColor: "#e74c3c",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignSelf: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
