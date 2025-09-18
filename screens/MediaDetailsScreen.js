// screens/MediaDetailScreen.js
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useApp } from "../app/context";

function fmtNumber(n) {
  if (n == null || Number.isNaN(Number(n))) return "-";
  try {
    return Number(n).toLocaleString();
  } catch {
    return String(n);
  }
}

export default function MediaDetailScreen() {
  const { id } = useLocalSearchParams();
  const { media } = useApp();
  const router = useRouter();

  const item = Array.isArray(media) ? media.find((m) => String(m.id) === String(id)) : null;

  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={{ fontSize: 18, textAlign: "center", marginTop: 20 }}>Media not found.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const {
    media_url,
    caption,
    timestamp,
    like_count,
    comments_count,
    insights = {},
    permalink,
    media_type,
  } = item;

  const displayDate = timestamp ? new Date(timestamp).toLocaleString() : "Unknown date";

  const openPermalink = async () => {
    if (!permalink) return;
    try {
      await Linking.openURL(permalink);
    } catch (err) {
      console.warn("Failed to open permalink:", err);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      {media_url ? (
        <Image
          source={{ uri: media_url }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.image, { justifyContent: "center", alignItems: "center" }]}>
          <Text style={{ color: "#666" }}>No media available</Text>
        </View>
      )}

      <Text style={styles.caption}>{caption || "No caption"}</Text>
      <Text style={{ color: "#666", marginBottom: 8 }}>📅 {displayDate}</Text>

      <View style={styles.metrics}>
        <Text>❤️ Likes: {fmtNumber(like_count)}</Text>
        <Text>💬 Comments: {fmtNumber(comments_count)}</Text>
        <Text>📣 Reach: {fmtNumber(insights?.reach)}</Text>
        <Text>👁️ Impressions: {fmtNumber(insights?.impressions)}</Text>
        <Text>⚡ Engagement: {fmtNumber(insights?.engagement)}</Text>
        <Text>🔖 Saved: {fmtNumber(insights?.saved)}</Text>
      </View>

      {permalink ? (
        <TouchableOpacity style={styles.permalinkButton} onPress={openPermalink}>
          <Text style={styles.permalinkText}>Open in Instagram</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  backButton: { marginBottom: 12 },
  backButtonText: { fontSize: 18, color: "#007AFF" },
  image: { width: "100%", height: 320, borderRadius: 10, marginBottom: 12, backgroundColor: "#f0f0f0" },
  caption: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
  metrics: { marginTop: 12, lineHeight: 26 },
  permalinkButton: {
    marginTop: 18,
    alignSelf: "center",
    backgroundColor: "#3897f0",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  permalinkText: { color: "white", fontWeight: "600" },
});
