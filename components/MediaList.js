// components/MediaList.js
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function fmtNumber(n) {
  if (n == null || Number.isNaN(Number(n))) return "-";
  try {
    return Number(n).toLocaleString();
  } catch {
    return String(n);
  }
}

export default function MediaList({ media, onSelect }) {
  if (!media || media.length === 0) {
    return <Text style={styles.noMedia}>No media found</Text>;
  }

  const renderItem = ({ item }) => {
    const isVideo = item.media_type === "VIDEO";
    const isImage = item.media_type === "IMAGE";
    const isCarousel = item.media_type === "CAROUSEL_ALBUM";

    return (
      <TouchableOpacity onPress={() => onSelect?.(item)}>
        <View style={styles.card}>
          {/* Media preview */}
          {isImage && item.media_url && (
            <Image source={{ uri: item.media_url }} style={styles.media} />
          )}

          {isVideo && (
            <View style={[styles.media, styles.videoPlaceholder]}>
              {item.media_url ? (
                <Image source={{ uri: item.media_url }} style={styles.media} />
              ) : null}
              <View style={styles.overlay}>
                <Text style={styles.overlayText}>🎥 Video</Text>
              </View>
            </View>
          )}

          {isCarousel && item.media_url && (
            <View style={[styles.media, styles.carouselPlaceholder]}>
              <Image source={{ uri: item.media_url }} style={styles.media} />
              <View style={styles.overlay}>
                <Text style={styles.overlayText}>📸 Carousel</Text>
              </View>
            </View>
          )}

          {!item.media_url && (
            <View style={[styles.media, styles.fallback]}>
              <Text style={{ color: "#666" }}>No media</Text>
            </View>
          )}

          {/* Caption */}
          <Text style={styles.caption} numberOfLines={2} ellipsizeMode="tail">
            {item.caption || "No caption"}
          </Text>

          {/* Timestamp */}
          {item.timestamp && (
            <Text style={styles.timestamp}>
              {new Date(item.timestamp).toLocaleDateString()}
            </Text>
          )}

          {/* Metrics */}
          <View style={styles.metrics}>
            <Text style={styles.metric}>❤️ {fmtNumber(item.like_count)}</Text>
            <Text style={styles.metric}>💬 {fmtNumber(item.comments_count)}</Text>
            <Text style={styles.metric}>
              📈 {fmtNumber(item.insights?.reach)}
            </Text>
            <Text style={styles.metric}>
              👁️ {fmtNumber(item.insights?.impressions)}
            </Text>
            <Text style={styles.metric}>🔖 {fmtNumber(item.insights?.saved)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={media}
      keyExtractor={(i) => String(i.id)}
      renderItem={renderItem}
    />
  );
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
    position: "relative",
    overflow: "hidden",
  },
  carouselPlaceholder: {
    position: "relative",
    overflow: "hidden",
  },
  overlay: {
    position: "absolute",
    top: "40%",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  overlayText: {
    backgroundColor: "rgba(0,0,0,0.6)",
    color: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 14,
    fontWeight: "bold",
  },
  caption: {
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  timestamp: {
    fontSize: 12,
    color: "#777",
    marginBottom: 6,
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
    marginRight: 8,
  },
  fallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  noMedia: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
  },
});
