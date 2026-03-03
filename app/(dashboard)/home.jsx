import { StyleSheet, View, ScrollView, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import ThemedView from "../../components/ThemedView";
import { useTheme } from "../../context/ThemeContext";
import ThemedText from "../../components/ThemedText";
import { useUser } from "../../hooks/useUser";
import { supabase } from "../../lib/supabase";
import {
  getWorkoutStats,
  loadWorkoutPlan,
  saveWorkoutPlan,
  toggleExerciseCompletion,
} from "../../services/workoutPlan";

const toLabel = (value = "") =>
  value
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const withAlpha = (color, alpha = "1f") =>
  typeof color === "string" && color.startsWith("#") && color.length === 7 ? `${color}${alpha}` : color;

const Home = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useUser();

  const [profile, setProfile] = useState(null);
  const [todayPlan, setTodayPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadPlan = async () => {
        try {
          setLoading(true);
          setError("");

          const plan = await loadWorkoutPlan(user?.id);
          if (!active) return;

          setTodayPlan(plan);

          const hasAnyDemo = plan.exercises.some((exercise) => Boolean(exercise.apiId));
          if (!hasAnyDemo) setError("Exercise demos are still syncing.");
        } catch {
          if (active) setError("Could not load your workout plan.");
        } finally {
          if (active) setLoading(false);
        }
      };

      loadPlan();

      return () => {
        active = false;
      };
    }, [user?.id])
  );

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      if (!user?.id) return;

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, goal")
        .eq("id", user.id)
        .single();

      if (active && !profileError) setProfile(data);
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [user?.id]);

  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      }).format(new Date()),
    []
  );

  const stats = useMemo(() => getWorkoutStats(todayPlan), [todayPlan]);
  const exercises = todayPlan?.exercises || [];

  const startWorkout = () => {
    router.push("/(dashboard)/workout-session");
  };

  const openExerciseDetail = (exercise) => {
    if (!exercise?.apiId) return;
    router.push(`/exercise/${exercise.apiId}`);
  };

  const handleToggleExerciseDone = (exerciseKey) => {
    setTodayPlan((current) => {
      if (!current) return current;
      const next = toggleExerciseCompletion(current, exerciseKey);
      saveWorkoutPlan(user?.id, next).catch(() => {
        setError("Could not save completion status.");
      });
      return next;
    });
  };

  return (
    <ThemedView style={styles.container} safe={true} safeBottom={false}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Image source={require("../../assets/rofit.png")} style={styles.logo} />
          <TouchableOpacity
            style={[styles.profileButton, { backgroundColor: theme.cardBackground }]}
            activeOpacity={0.8}
            onPress={() => router.push("/(dashboard)/profile")}
          >
            <Ionicons name="person" size={18} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <ThemedText style={styles.title}>Welcome Back, {profile?.first_name || "Athlete"}</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          {profile?.goal ? `Goal: ${profile.goal}` : "Keep it clean. Keep it consistent."}
        </ThemedText>

        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={[styles.summaryGlow, { backgroundColor: theme.primary }]} />

          <View style={styles.summaryHeader}>
            <View style={[styles.summaryIcon, { backgroundColor: theme.background }]}>
              <MaterialCommunityIcons name="calendar-month" size={18} color={theme.primary} />
            </View>
            <View style={styles.summaryInfo}>
              <ThemedText style={styles.summaryTitle}>Today&apos;s Plan</ThemedText>
              <ThemedText style={[styles.summaryDate, { color: theme.textSecondary }]}>{dateLabel}</ThemedText>
            </View>
            <View style={[styles.summaryBadge, { backgroundColor: theme.background }]}>
              <ThemedText style={[styles.summaryBadgeText, { color: theme.primary }]}>
                {stats.completedExercises}/{stats.totalExercises}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.progressTrack, { backgroundColor: theme.background }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.primary,
                  width: `${Math.round(stats.completionRate * 100)}%`,
                },
              ]}
            />
          </View>

          <View style={styles.summaryMetaRow}>
            <View style={[styles.summaryMetaChip, { backgroundColor: theme.background }]}>
              <ThemedText style={[styles.summaryMetaText, { color: theme.textSecondary }]}>
                {stats.totalSets} sets
              </ThemedText>
            </View>
            <View style={[styles.summaryMetaChip, { backgroundColor: theme.background }]}>
              <ThemedText style={[styles.summaryMetaText, { color: theme.textSecondary }]}>
                {stats.estimatedMinutes} min est.
              </ThemedText>
            </View>
            <View style={[styles.summaryMetaChip, { backgroundColor: theme.background }]}>
              <ThemedText style={[styles.summaryMetaText, { color: theme.textSecondary }]}>
                {stats.completedSets} done
              </ThemedText>
            </View>
          </View>

          <TouchableOpacity style={[styles.startButton, { backgroundColor: theme.primary }]} onPress={startWorkout}>
            <Ionicons name="play" size={14} color="#ffffff" />
            <ThemedText style={styles.startButtonText}>Start Workout</ThemedText>
          </TouchableOpacity>

          {loading && (
            <View style={styles.stateRow}>
              <ActivityIndicator color={theme.primary} size="small" />
              <ThemedText style={[styles.stateText, { color: theme.textSecondary }]}>Loading today&apos;s plan...</ThemedText>
            </View>
          )}

          {!loading && error ? <ThemedText style={[styles.errorText, { color: theme.error }]}>{error}</ThemedText> : null}
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Assigned Exercises</ThemedText>
          <ThemedText style={[styles.sectionHint, { color: theme.textSecondary }]}>Track sets, weight and notes</ThemedText>
        </View>

        <View style={styles.exerciseList}>
          {exercises.map((exercise) => {
            const completedSets = exercise.setLogs.filter((setLog) => setLog.completed).length;
            const totalSets = exercise.setLogs.length;
            const isDone = totalSets > 0 && completedSets === totalSets;
            const isDemoAvailable = Boolean(exercise.apiId);

            return (
              <View
                key={exercise.key}
                style={[
                  styles.exerciseCard,
                  {
                    backgroundColor: isDone ? withAlpha(theme.primary, "14") : theme.cardBackground,
                    borderColor: theme.border,
                  },
                  isDone && { borderColor: theme.primary },
                ]}
              >
                <View style={styles.exerciseInfo}>
                  <ThemedText
                    style={[
                      styles.exerciseName,
                      isDone && styles.exerciseDone,
                      isDone && { color: theme.textSecondary },
                    ]}
                  >
                    {exercise.displayName}
                  </ThemedText>

                  <View style={styles.exerciseTagRow}>
                    <View style={[styles.exerciseTag, { backgroundColor: theme.background }]}>
                      <ThemedText style={[styles.exerciseTagText, { color: theme.textSecondary }]}>
                        {exercise.plannedSets} x {exercise.plannedReps}
                      </ThemedText>
                    </View>
                    <View style={[styles.exerciseTag, { backgroundColor: theme.background }]}>
                      <ThemedText style={[styles.exerciseTagText, { color: theme.primary }]}>{exercise.plannedLoad}</ThemedText>
                    </View>
                    <View style={[styles.exerciseTag, { backgroundColor: theme.background }]}>
                      <ThemedText style={[styles.exerciseTagText, { color: theme.textSecondary }]}>
                        {completedSets}/{totalSets} sets
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.detailChipRow}>
                    {exercise.target ? (
                      <View style={[styles.detailChip, { borderColor: theme.border }]}>
                        <ThemedText style={[styles.detailChipText, { color: theme.textSecondary }]}>
                          {toLabel(exercise.target)}
                        </ThemedText>
                      </View>
                    ) : null}

                    {exercise.equipment ? (
                      <View style={[styles.detailChip, { borderColor: theme.border }]}>
                        <ThemedText style={[styles.detailChipText, { color: theme.textSecondary }]}>
                          {toLabel(exercise.equipment)}
                        </ThemedText>
                      </View>
                    ) : null}

                    {exercise.note ? (
                      <View style={[styles.detailChip, { borderColor: theme.primary }]}>
                        <ThemedText style={[styles.detailChipText, { color: theme.primary }]}>Note added</ThemedText>
                      </View>
                    ) : null}

                    {isDone ? (
                      <View style={[styles.doneChip, { backgroundColor: theme.primary }]}>
                        <Ionicons name="checkmark-circle" size={11} color="#ffffff" />
                        <ThemedText style={styles.doneChipText}>Completed</ThemedText>
                      </View>
                    ) : null}
                  </View>
                </View>

                <View style={styles.actionColumn}>
                  <TouchableOpacity
                    style={[styles.playActionButton, { backgroundColor: theme.background, borderColor: theme.border }]}
                    activeOpacity={isDemoAvailable ? 0.8 : 1}
                    onPress={() => openExerciseDetail(exercise)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={isDemoAvailable ? "play" : "remove"}
                      size={14}
                      color={isDemoAvailable ? theme.primary : theme.textSecondary}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.cardActionButton,
                      isDone
                        ? { backgroundColor: theme.primary, borderColor: theme.primary }
                        : { backgroundColor: "transparent", borderColor: theme.border },
                    ]}
                    activeOpacity={0.85}
                    onPress={() => handleToggleExerciseDone(exercise.key)}
                    hitSlop={8}
                  >
                    {isDone ? (
                      <Ionicons name="checkmark" size={14} color={theme.background} />
                    ) : (
                      <Ionicons name="ellipse-outline" size={14} color={theme.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ThemedView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  topBar: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 50,
  },
  profileButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 18,
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
  },
  summaryCard: {
    marginTop: 18,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  summaryGlow: {
    position: "absolute",
    right: -42,
    top: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.14,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  summaryDate: {
    marginTop: 4,
    fontSize: 12,
  },
  summaryBadge: {
    minWidth: 52,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  summaryBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  progressTrack: {
    marginTop: 14,
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  summaryMetaRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    rowGap: 8,
  },
  summaryMetaChip: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  summaryMetaText: {
    fontSize: 12,
    fontWeight: "500",
  },
  startButton: {
    marginTop: 14,
    height: 42,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  startButtonText: {
    marginLeft: 8,
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  stateRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  stateText: {
    marginLeft: 8,
    fontSize: 12,
  },
  errorText: {
    marginTop: 10,
    fontSize: 12,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  sectionHint: {
    fontSize: 11,
  },
  exerciseList: {
    gap: 12,
  },
  exerciseCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: "700",
  },
  exerciseDone: {
    textDecorationLine: "line-through",
  },
  exerciseTagRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    rowGap: 8,
  },
  exerciseTag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
  },
  exerciseTagText: {
    fontSize: 11,
    fontWeight: "600",
  },
  detailChipRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  detailChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  detailChipText: {
    fontSize: 11,
    fontWeight: "500",
  },
  doneChip: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  doneChipText: {
    marginLeft: 4,
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "700",
  },
  actionColumn: {
    marginLeft: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  playActionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginVertical: 3,
  },
  cardActionButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    marginVertical: 3,
  },
});
