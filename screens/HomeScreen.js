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
  const [username, setUsername] = useState("");

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

  // Fetch username and media
  const handleRefresh = async () => {
    if (!accessToken) {
      Alert.alert("Error", "No access token found.");
      return;
    }

    setLoading(true);
    try {
      // Get Facebook pages linked to account
      const pagesRes = await ApiService.getPages(accessToken);
      const pages = pagesRes?.data ?? [];
      if (!pages.length) throw new Error("No Facebook Pages linked to your account.");

      const pageId = pages[0].id;

      // Get Instagram Business Account ID
      const igUserId = await ApiService.getIgUserIdFromPage(pageId, accessToken);
      if (!igUserId) throw new Error("No Instagram Business Account linked to this page.");

      // Fetch username once
      try {
        const userRes = await ApiService.getMediaFields(igUserId, accessToken, ["username"]);
        setUsername(userRes.username || "");
      } catch {
        setUsername("");
      }

      // Fetch media
      const mediaRes = await ApiService.getMedia(igUserId, accessToken, 50);
      const posts = mediaRes?.data ?? [];

      // Fetch insights and enrich posts
      const postsWithInsights = await Promise.all(
        posts.map(async (post) => {
          let enriched = { ...post };

          try {
            const insightsRes = await ApiService.getMediaInsights(post.id, accessToken, [
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

          // Fetch like_count, comments_count, media_url, etc.
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
            } catch {}
          }

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

  // Logout
  const handleLogout = async () => {
    try {
      await AuthService.clearToken();
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
          <MediaList
            media={filteredMedia}
            onSelect={(item) =>
              navigation.navigate("MediaDetail", { post: item })
            }
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

      {username ? (
        <Text
          style={{ textAlign: "center", marginTop: 30, color: "#888", fontSize: 16 }}
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
