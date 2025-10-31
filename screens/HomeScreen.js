// screens/HomeScreen.js
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { getMedia, getPagePosts, getUserPages } from "../api/graphAPI";
import { AuthService } from "../services/authService";

export default function HomeScreen({ route, navigation }) {
  const { accessToken, igBusinessAccountId } = route.params || {};
  console.log("HomeScreen: Received igBusinessAccountId from route params:", igBusinessAccountId);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayingFacebookPosts, setDisplayingFacebookPosts] = useState(false);
  const [platform, setPlatform] = useState('instagram'); // 'instagram' or 'facebook'
  const [pages, setPages] = useState([]);

  // Fetch media and pages on component mount
  useEffect(() => {
    if (accessToken) {
      fetchPages();
      fetchMedia();
    } else {
      setLoading(false);
      setError("Missing Access Token. Please log in again.");
    }

    // Add a logout button to the header
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={{ marginRight: 10 }}>
          <Text style={{ color: "#3498db", fontSize: 16 }}>Logout</Text>
        </TouchableOpacity>
      ),
    });
  }, [accessToken, navigation]); // Added dependencies

  const handleLogout = async () => {
    try {
      await AuthService.clearTokenInfo();
      navigation.replace("Login"); // Use replace to prevent going back to the logged-in state
    } catch (err) {
      console.error("Failed to logout:", err);
    }
  };

  const fetchPages = async () => {
    try {
      const pagesResponse = await getUserPages(accessToken);
      setPages(pagesResponse.data.data || []);
    } catch (err) {
      console.error("Failed to fetch pages:", err);
    }
  };

  const fetchMedia = async (selectedPlatform = platform) => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (selectedPlatform === 'instagram' && igBusinessAccountId) {
        console.log("HomeScreen: Fetching Instagram media for IG Business Account ID:", igBusinessAccountId);
        response = await getMedia(igBusinessAccountId, accessToken);
        const getInsightValue = (item, metricName) => {
          return item.insights?.data?.find(insight => insight.name === metricName)?.values?.[0]?.value || 0;
        };
        const transformedMedia = response.data.data.map(item => ({
          ...item,
          // Add insights to each media item
          reach: getInsightValue(item, 'reach'),
          engagement: getInsightValue(item, 'engagement'),
          impressions: getInsightValue(item, 'impressions'),
          saved: getInsightValue(item, 'saved'),
        }));
        setMedia(transformedMedia || []);
        setDisplayingFacebookPosts(false);
      } else if (selectedPlatform === 'facebook' && pages.length > 0) {
        console.log("HomeScreen: Fetching Facebook Page posts for page:", pages[0].name, "ID:", pages[0].id);
        response = await getPagePosts(pages[0].id, accessToken);
        // Helper to extract insight values
        const getInsightValue = (post, metricName) => {
          return post.insights?.data?.find(insight => insight.name === metricName)?.values?.[0]?.value || 0;
        };
        // Transform Facebook posts to look somewhat like Instagram media for display
        const transformedPosts = response.data.data.map(post => ({
          id: post.id,
          caption: post.message || post.story || "Facebook Post",
          media_type: "FACEBOOK_POST", // Custom type for display
          media_url: post.full_picture,
          thumbnail_url: post.full_picture,
          timestamp: post.created_time,
          permalink: post.permalink_url || `https://www.facebook.com/${post.id}`,
          // Add insights
          reach: getInsightValue(post, 'post_impressions_unique'),
          engagement: getInsightValue(post, 'post_engaged_users'),
          likes: post.likes?.summary?.total_count || 0,
          comments: post.comments?.summary?.total_count || 0,
        }));
        setMedia(transformedPosts || []);
        setDisplayingFacebookPosts(true);
      } else {
        setError(`No ${selectedPlatform === 'instagram' ? 'Instagram Business Account' : 'Facebook Pages'} found.`);
      }
    } catch (err) {
      console.error("HomeScreen: Error during fetchMedia:", err.response?.data || err.message);
      setError("Failed to fetch data. Please try again. Error: " + (err.response?.data?.error?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformSwitch = (newPlatform) => {
    setPlatform(newPlatform);
    fetchMedia(newPlatform);
  };

  const renderItem = ({ item }) => (
    <View style={styles.mediaItem}>
      {item.thumbnail_url && (
        <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnail} />
      )}
      <Text style={styles.caption} numberOfLines={3}>{item.caption || "No caption"}</Text>
      <View style={styles.insightsContainer}>
        {platform === 'facebook' ? (
          <>
          <Text style={styles.insightText}>📈 Reach: {item.reach}</Text>
          <Text style={styles.insightText}>❤️ Likes: {item.likes}</Text>
          <Text style={styles.insightText}>💬 Comments: {item.comments}</Text>
          <Text style={styles.insightText}>⚡ Engagement: {item.engagement}</Text>
          </>
        ) : (
          <>
            <Text style={styles.insightText}>❤️ Likes: {item.like_count}</Text>
            <Text style={styles.insightText}>💬 Comments: {item.comments_count}</Text>
            <Text style={styles.insightText}>📈 Reach: {item.reach}</Text>
            <Text style={styles.insightText}>👁️ Impressions: {item.impressions}</Text>
          </>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading media...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>
          {platform === 'facebook' ? "Your Facebook Page Posts" : "Your Instagram Media"}
        </Text>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, platform === 'instagram' && styles.activeToggle]}
            onPress={() => handlePlatformSwitch('instagram')}
          >
            <Text style={[styles.toggleText, platform === 'instagram' && styles.activeToggleText]}>Instagram</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, platform === 'facebook' && styles.activeToggle]}
            onPress={() => handlePlatformSwitch('facebook')}
          >
            <Text style={[styles.toggleText, platform === 'facebook' && styles.activeToggleText]}>Facebook</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchMedia}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {platform === 'facebook' ? "Your Facebook Page Posts" : "Your Instagram Media"}
      </Text>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, platform === 'instagram' && styles.activeToggle]}
          onPress={() => handlePlatformSwitch('instagram')}
        >
          <Text style={[styles.toggleText, platform === 'instagram' && styles.activeToggleText]}>Instagram</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, platform === 'facebook' && styles.activeToggle]}
          onPress={() => handlePlatformSwitch('facebook')}
        >
          <Text style={[styles.toggleText, platform === 'facebook' && styles.activeToggleText]}>Facebook</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={media}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
  },
  listContainer: {
    padding: 20,
  },
  mediaItem: {
    backgroundColor: "white",
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  thumbnail: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  caption: {
    fontSize: 16,
    color: "#333",
  },
  insightsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  insightText: {
    fontSize: 14,
    color: '#555',
  },
  errorText: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#3498db",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3498db',
    backgroundColor: 'white',
  },
  activeToggle: {
    backgroundColor: '#3498db',
  },
  toggleText: {
    fontSize: 16,
    color: '#3498db',
  },
  activeToggleText: {
    color: 'white',
  },
});
