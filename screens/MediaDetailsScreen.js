// screens/MediaDetailScreen.js
import { Image, StyleSheet, Text, View } from "react-native";

export default function MediaDetailScreen({ route }) {
  const { item } = route.params;

  return (
    <View style={styles.container}>
      {item.media_url && (
        <Image source={{ uri: item.media_url }} style={styles.image} />
      )}
      <Text style={styles.caption}>{item.caption || "No caption"}</Text>
      <Text>📅 {item.timestamp}</Text>
      <View style={styles.metrics}>
        <Text>Reach: {item.insights?.reach || "-"}</Text>
        <Text>Impressions: {item.insights?.impressions || "-"}</Text>
        <Text>Engagement: {item.insights?.engagement || "-"}</Text>
        <Text>Shares: {item.insights?.shares || "-"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  image: { width: "100%", height: 300, borderRadius: 10, marginBottom: 15 },
  caption: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  metrics: { marginTop: 10 },
});
