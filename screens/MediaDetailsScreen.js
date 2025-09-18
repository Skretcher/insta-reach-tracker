//screens/MediaDetailsScreen.js
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useApp } from "../app/context";

export default function MediaDetailScreen() {
  const { id } = useLocalSearchParams();
  const { media } = useApp();
  const router = useRouter();

  const item = media.find(m => String(m.id) === String(id));

  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={{ fontSize: 18, textAlign: 'center', marginTop: 20 }}>Media not found.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      {item?.media_url && (
        <Image source={{ uri: item.media_url }} style={styles.image} />
      )}

      <Text style={styles.caption}>{item.caption || "No caption"}</Text>
      <Text>📅 {new Date(item.timestamp).toLocaleString()}</Text>
      <View style={styles.metrics}>
        <Text>❤️ Likes: {item.like_count ?? "-"}</Text>
        <Text>💬 Comments: {item.comments_count ?? "-"}</Text>
        <Text>Reach: {item.insights?.reach ?? "-"}</Text>
        <Text>Impressions: {item.insights?.impressions ?? "-"}</Text>
        <Text>Engagement: {item.insights?.engagement ?? "-"}</Text>
        <Text>Saved: {item.insights?.saved ?? "-"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  backButton: { marginBottom: 20 },
  backButtonText: { fontSize: 18, color: '#007AFF' },
  image: { width: "100%", height: 300, borderRadius: 10, marginBottom: 15 },
  caption: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  metrics: { marginTop: 10, lineHeight: 24 },
});
