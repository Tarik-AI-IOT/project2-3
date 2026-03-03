import { useEffect, useState } from "react";
import { StyleSheet, View, ScrollView, Image, ActivityIndicator, TouchableOpacity, useWindowDimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ThemedView from "../../../components/ThemedView";
import ThemedText from "../../../components/ThemedText";
import { useTheme } from "../../../context/ThemeContext";
import { fetchExerciseById, getExerciseImageSource } from "../../../services/exercises";

const toHttps = (url = "") => (url.startsWith("http://") ? url.replace("http://", "https://") : url);

const ExerciseDetail = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { id } = useLocalSearchParams();
  const exerciseId = Array.isArray(id) ? id[0] : id;
  const [exercise, setExercise] = useState(null);
  const [imageSource, setImageSource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [error, setError] = useState("");
  const [mediaError, setMediaError] = useState(false);
  const imageHeight = Math.min(Math.max(screenWidth * 0.68, 220), 460);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        setMediaError(false);
        const data = await fetchExerciseById(exerciseId);

        const directGif =
          data?.gifUrl || data?.gifurl || data?.imageUrl || data?.image || data?.thumbnailUrl;
        if (active) {
          setExercise(data);
          setImageSource(
            typeof directGif === "string" && directGif.trim() ? { uri: toHttps(directGif.trim()) } : null
          );
        }
      } catch (err) {
        if (active) setError("Could not load exercise.");
      } finally {
        if (active) setLoading(false);
      }



    };
    if (exerciseId) load();
    return () => {
      active = false;
    };
  }, [exerciseId]);

  useEffect(() => {
    let active = true;

    const loadMedia = async () => {
      if (!exercise?.id || imageSource) return;

      try {
        setMediaLoading(true);
        setMediaError(false);
        const source = await getExerciseImageSource(exercise.id);
        if (active) setImageSource(source);
      } catch {
        if (active) setMediaError(true);
      } finally {
        if (active) setMediaLoading(false);
      }
    };

    loadMedia();

    return () => {
      active = false;
    };
  }, [exercise?.id, imageSource]);

  return (
    <ThemedView style={styles.container} safe={true} safeBottom={false}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={[styles.circleButton, { backgroundColor: theme.cardBackground }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={18} color={theme.text} />
        </TouchableOpacity>

        {loading && <ActivityIndicator color={theme.primary} style={styles.state} />}
        {!loading && error ? (
          <ThemedText style={[styles.state, { color: theme.error }]}>{error}</ThemedText>
        ) : null}

        {!loading && !error && exercise && (
          <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
            <ThemedText style={styles.title}>{exercise.name}</ThemedText>
            {mediaLoading ? (
              <ActivityIndicator color={theme.primary} style={styles.imageLoader} />
            ) : imageSource && !mediaError ? (
              <View style={[styles.imageFrame, { backgroundColor: theme.background, height: imageHeight }]}>
                <Image
                  source={imageSource}
                  style={styles.image}
                  resizeMode="contain"
                  onError={() => setMediaError(true)}
                />
              </View>
            ) : (
              <ThemedText style={{ color: theme.textSecondary, marginTop: 12 }}>
                No GIF available for this exercise.
              </ThemedText>
            )}

            <View style={styles.metaRow}>
              <ThemedText style={[styles.metaLabel, { color: theme.textSecondary }]}>
                Target
              </ThemedText>
              <ThemedText style={styles.metaValue}>{exercise.target}</ThemedText>
            </View>
            <View style={styles.metaRow}>
              <ThemedText style={[styles.metaLabel, { color: theme.textSecondary }]}>
                Equipment
              </ThemedText>
              <ThemedText style={styles.metaValue}>{exercise.equipment}</ThemedText>
            </View>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
};

export default ExerciseDetail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  circleButton: {
    marginTop: 6,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  state: {
    marginTop: 20,
  },
  card: {
    marginTop: 20,
    borderRadius: 20,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  imageFrame: {
    marginTop: 12,
    width: "100%",
    alignSelf: "center",
    borderRadius: 16,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageLoader: {
    marginTop: 18,
  },
  metaRow: {
    marginTop: 12,
  },
  metaLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  metaValue: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "600",
    textTransform: "capitalize",
  },
});
