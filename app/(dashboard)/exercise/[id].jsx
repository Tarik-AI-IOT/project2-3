import { useEffect, useState } from "react";
import { StyleSheet, View, ScrollView, Image, ActivityIndicator, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ThemedView from "../../../components/ThemedView";
import ThemedText from "../../../components/ThemedText";
import { useTheme } from "../../../context/ThemeContext";
import { fetchExerciseById } from "../../../services/exercises";

const ExerciseDetail = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchExerciseById(id);

        if (active) setExercise(data);
      } catch (err) {
        if (active) setError("Could not load exercise.");
      } finally {
        if (active) setLoading(false);
      }



    };
    if (id) load();
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <ThemedView style={styles.container} safe={true}>
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
            {exercise?.id ? (
  <Image
    source={{
      uri: `https://exercisedb.p.rapidapi.com/image?exerciseId=${exercise.id}&resolution=720`,
      headers: {
        "X-RapidAPI-Key": process.env.EXPO_PUBLIC_RAPIDAPI_KEY,
        "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
      },
    }}
    style={styles.image}
  />
) : (
  <ThemedText style={{ color: theme.textSecondary, marginTop: 12 }}>
    No image available.
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
  image: {
    marginTop: 12,
    width: "100%",
    height: 220,
    borderRadius: 16,
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
