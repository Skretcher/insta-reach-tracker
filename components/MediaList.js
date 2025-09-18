// components/MediaList.js
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function MediaList({ media, onSelect }) {
  if (!media || media.length === 0) {
    return <Text style={styles.noMedia}>No media found</Text>;
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => onSelect?.(item)}>
      <View style={styles.card}>
        {item.media_type === "IMAGE" && item.media_url && (
          <Image source={{ uri: item.media_url }} style={styles.media} />
        )}

        {item.media_type === "VIDEO" && item.media_url && (
          <View style={[styles.media, styles.videoPlaceholder]}>
            <Text style={styles.videoText}>🎥 Video</Text>
          </View>
        )}

        <Text style={styles.caption} numberOfLines={2} ellipsizeMode="tail">
          {item.caption || "No caption"}
        </Text>

        <View style={styles.metrics}>
          <Text style={styles.metric}>❤️ {item.like_count ?? "-"}</Text>
          <Text style={styles.metric}>💬 {item.comments_count ?? "-"}</Text>
          <Text style={styles.metric}>📈 {item.insights?.reach ?? "-"}</Text>
          <Text style={styles.metric}>👁️ {item.insights?.impressions ?? "-"}</Text>
          <Text style={styles.metric}>🔖 {item.insights?.saved ?? "-"}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return <FlatList data={media} keyExtractor={(i) => String(i.id)} renderItem={renderItem} />;
}

const styles = StyleSheet.create({
  card: {
    padding: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  media: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#f0f0f0",
  },
  videoPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  videoText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  caption: {
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  metrics: {
    marginTop: 5,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metric: {
    fontSize: 12,
    color: "#555",
  },
  noMedia: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
  },
});
