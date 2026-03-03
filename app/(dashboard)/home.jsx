import { StyleSheet, View, ScrollView, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import ThemedView from "../../components/ThemedView";
import { useTheme } from "../../context/ThemeContext";
import ThemedText from "../../components/ThemedText";
import { resolveExerciseMatch } from "../../services/exercises";
import { useUser } from "../../hooks/useUser";
import { supabase } from "../../lib/supabase";

const TODAY_PLAN = [
  { key: "barbell-squat", displayName: "Barbell Squat", sets: 4, reps: 8, load: "185 lbs", done: true },
  { key: "romanian-deadlift", displayName: "Romanian Deadlift", sets: 3, reps: 10, load: "135 lbs", done: true },
  { key: "leg-press", displayName: "Leg Press", sets: 3, reps: 12, load: "315 lbs", done: false },
  { key: "leg-curl", displayName: "Leg Curl", sets: 3, reps: 12, load: "90 lbs", done: false },
];

const toLabel = (value = "") =>
  value
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const buildFallbackPlan = () =>
  TODAY_PLAN.map((exercise) => ({
    ...exercise,
    apiId: null,
    target: "",
    equipment: "",
  }));

const Home = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useUser();

  const [profile, setProfile] = useState(null);
  const [todayExercises, setTodayExercises] = useState(buildFallbackPlan);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadTodayPlan = async () => {
      try {
        setLoading(true);
        setError("");

        const enriched = await Promise.all(
          TODAY_PLAN.map(async (exercise) => {
            try {
              const match = await resolveExerciseMatch(exercise.displayName);

              return {
                ...exercise,
                apiId: match?.id ?? null,
                target: match?.target ?? "",
                equipment: match?.equipment ?? "",
              };
            } catch (matchError) {
              return {
                ...exercise,
                apiId: null,
                target: "",
                equipment: "",
              };
            }
          })
        );

        if (!active) return;

        setTodayExercises(enriched);

        const linkedCount = enriched.filter((item) => Boolean(item.apiId)).length;
        if (linkedCount === 0) {
          setError("Live ExerciseDB demos are unavailable right now.");
        }
      } catch (loadError) {
        if (active) {
          setTodayExercises(buildFallbackPlan());
          setError("Could not sync live exercise demos.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadTodayPlan();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      if (!user?.id) return;

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", user.id)
        .single();

      if (active && !profileError) setProfile(data);
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [user?.id]);

  const completedCount = useMemo(() => todayExercises.filter((exercise) => exercise.done).length, [todayExercises]);
  const totalCount = todayExercises.length;
  const completionRate = totalCount ? completedCount / totalCount : 0;

  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      }).format(new Date()),
    []
  );

  const estimatedMinutes = useMemo(
    () => todayExercises.reduce((sum, exercise) => sum + exercise.sets * 3, 0),
    [todayExercises]
  );

  const openExerciseDetail = (exercise) => {
    if (!exercise?.apiId) return;
    router.push(`/exercise/${exercise.apiId}`);
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

        <ThemedText style={styles.title}>Welcome Back, {profile?.first_name || "John"}</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Keep it clean. Keep it consistent.
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
                {completedCount}/{totalCount}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.progressTrack, { backgroundColor: theme.background }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.primary,
                  width: `${Math.round(completionRate * 100)}%`,
                },
              ]}
            />
          </View>

          <View style={styles.summaryMetaRow}>
            <View style={[styles.summaryMetaChip, { backgroundColor: theme.background }]}>
              <ThemedText style={[styles.summaryMetaText, { color: theme.textSecondary }]}>
                {totalCount} exercises
              </ThemedText>
            </View>
            <View style={[styles.summaryMetaChip, { backgroundColor: theme.background }]}>
              <ThemedText style={[styles.summaryMetaText, { color: theme.textSecondary }]}>
                {estimatedMinutes} min est.
              </ThemedText>
            </View>
          </View>

          {loading && (
            <View style={styles.stateRow}>
              <ActivityIndicator color={theme.primary} size="small" />
              <ThemedText style={[styles.stateText, { color: theme.textSecondary }]}>
                Syncing ExerciseDB demos...
              </ThemedText>
            </View>
          )}

          {!loading && error ? (
            <ThemedText style={[styles.errorText, { color: theme.error }]}>{error}</ThemedText>
          ) : null}
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Today&apos;s Exercises</ThemedText>
          <ThemedText style={[styles.sectionHint, { color: theme.textSecondary }]}>
            Tap card to open demo
          </ThemedText>
        </View>

        <View style={styles.exerciseList}>
          {todayExercises.map((exercise) => {
            const isDemoAvailable = Boolean(exercise.apiId);

            return (
              <TouchableOpacity
                key={exercise.key}
                style={[
                  styles.exerciseCard,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border,
                  },
                  !isDemoAvailable && styles.exerciseCardDisabled,
                ]}
                activeOpacity={isDemoAvailable ? 0.8 : 1}
                onPress={() => openExerciseDetail(exercise)}
              >
                <View
                  style={[
                    styles.checkCircle,
                    exercise.done
                      ? { backgroundColor: theme.primary, borderColor: theme.primary }
                      : { backgroundColor: "transparent", borderColor: theme.border },
                  ]}
                >
                  {exercise.done ? <Ionicons name="checkmark" size={14} color={theme.background} /> : null}
                </View>

                <View style={styles.exerciseInfo}>
                  <ThemedText
                    style={[
                      styles.exerciseName,
                      exercise.done && styles.exerciseDone,
                      exercise.done && { color: theme.textSecondary },
                    ]}
                  >
                    {exercise.displayName}
                  </ThemedText>

                  <View style={styles.exerciseTagRow}>
                    <View style={[styles.exerciseTag, { backgroundColor: theme.background }]}>
                      <ThemedText style={[styles.exerciseTagText, { color: theme.textSecondary }]}>
                        {exercise.sets} x {exercise.reps}
                      </ThemedText>
                    </View>
                    <View style={[styles.exerciseTag, { backgroundColor: theme.background }]}>
                      <ThemedText style={[styles.exerciseTagText, { color: theme.primary }]}>{exercise.load}</ThemedText>
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

                    {!isDemoAvailable ? (
                      <ThemedText style={[styles.detailChipText, { color: theme.textSecondary }]}>
                        No live demo yet
                      </ThemedText>
                    ) : null}
                  </View>
                </View>

                <View style={[styles.chevronWrap, { backgroundColor: theme.background }]}>
                  <Ionicons
                    name={isDemoAvailable ? "chevron-forward" : "remove"}
                    size={16}
                    color={isDemoAvailable ? theme.primary : theme.textSecondary}
                  />
                </View>
              </TouchableOpacity>
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
  exerciseCardDisabled: {
    opacity: 0.86,
  },
  checkCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
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
  chevronWrap: {
    marginLeft: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
