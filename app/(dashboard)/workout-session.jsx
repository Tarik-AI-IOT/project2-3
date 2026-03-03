import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../hooks/useUser";
import {
  getWorkoutStats,
  loadWorkoutPlan,
  markWorkoutFinished,
  saveWorkoutPlan,
  toggleExerciseCompletion,
  toggleSetCompletion,
  updateExerciseNote,
  updateSetField,
  updateWorkoutNote,
} from "../../services/workoutPlan";

const toLabel = (value = "") =>
  value
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const WorkoutSession = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useUser();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedAt, setSavedAt] = useState("");
  const skipNextAutosaveRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const load = async () => {
        try {
          setLoading(true);
          setSaveError("");
          skipNextAutosaveRef.current = true;
          const loadedPlan = await loadWorkoutPlan(user?.id);
          if (active) setPlan(loadedPlan);
        } catch {
          if (active) setSaveError("Could not load your workout session.");
        } finally {
          if (active) setLoading(false);
        }
      };

      load();

      return () => {
        active = false;
      };
    }, [user?.id])
  );

  useEffect(() => {
    if (!plan) return;
    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      try {
        setSaving(true);
        setSaveError("");
        await saveWorkoutPlan(user?.id, plan);
        if (!active) return;
        setSaving(false);
        setSavedAt(
          new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }).format(new Date())
        );
      } catch {
        if (!active) return;
        setSaving(false);
        setSaveError("Could not save your latest changes.");
      }
    }, 280);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [plan, user?.id]);

  const stats = useMemo(() => getWorkoutStats(plan), [plan]);

  const updatePlan = (updater) => {
    setPlan((current) => (current ? updater(current) : current));
  };

  const handleSetField = (exerciseKey, setNumber, field, value) => {
    updatePlan((current) => updateSetField(current, exerciseKey, setNumber, field, value));
  };

  const handleToggleSet = (exerciseKey, setNumber) => {
    updatePlan((current) => toggleSetCompletion(current, exerciseKey, setNumber));
  };

  const handleToggleExercise = (exerciseKey) => {
    updatePlan((current) => toggleExerciseCompletion(current, exerciseKey));
  };

  const handleExerciseNote = (exerciseKey, note) => {
    updatePlan((current) => updateExerciseNote(current, exerciseKey, note));
  };

  const handleWorkoutNote = (note) => {
    updatePlan((current) => updateWorkoutNote(current, note));
  };

  const openDemo = (exercise) => {
    if (!exercise?.apiId) return;
    router.push(`/exercise/${exercise.apiId}`);
  };

  const finishWorkout = async () => {
    if (!plan) return;

    const finishedPlan = markWorkoutFinished(plan);
    setPlan(finishedPlan);

    try {
      setSaving(true);
      await saveWorkoutPlan(user?.id, finishedPlan);
      setSaving(false);
      router.push("/(dashboard)/home");
    } catch {
      setSaving(false);
      setSaveError("Could not finish workout right now. Your changes are still on this device.");
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container} safe={true} safeBottom={false}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={theme.primary} />
          <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>Loading workout session...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container} safe={true} safeBottom={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={[styles.circleButton, { backgroundColor: theme.cardBackground }]}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={18} color={theme.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.finishTopButton, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
              onPress={finishWorkout}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="flag-checkered" size={14} color={theme.primary} />
              <ThemedText style={[styles.finishTopText, { color: theme.primary }]}>Finish</ThemedText>
            </TouchableOpacity>
          </View>

          <ThemedText style={styles.title}>Workout Session</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Log your real numbers and mark each set complete.
          </ThemedText>

          <View style={[styles.summaryCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryTitle}>Set Progress</ThemedText>
              <ThemedText style={[styles.summaryValue, { color: theme.primary }]}>
                {stats.completedSets}/{stats.totalSets}
              </ThemedText>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: theme.background }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: theme.primary, width: `${Math.round(stats.completionRate * 100)}%` },
                ]}
              />
            </View>

            <View style={styles.metaRow}>
              <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
                {stats.completedExercises}/{stats.totalExercises} exercises done
              </ThemedText>
              <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
                {stats.estimatedMinutes} min total
              </ThemedText>
            </View>

            <View style={styles.metaRow}>
              <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
                {saving ? "Saving..." : savedAt ? `Saved at ${savedAt}` : "No edits yet"}
              </ThemedText>
              {saveError ? <ThemedText style={[styles.metaText, { color: theme.error }]}>{saveError}</ThemedText> : null}
            </View>
          </View>

          <View style={styles.exerciseList}>
            {plan?.exercises?.map((exercise) => {
              const completedSets = exercise.setLogs.filter((setLog) => setLog.completed).length;
              const totalSets = exercise.setLogs.length;
              const isDone = totalSets > 0 && completedSets === totalSets;

              return (
                <View
                  key={exercise.key}
                  style={[
                    styles.exerciseCard,
                    {
                      backgroundColor: theme.cardBackground,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.exerciseHeader}>
                    <View style={styles.exerciseHeaderLeft}>
                      <View
                        style={[
                          styles.exerciseStatusDot,
                          isDone
                            ? { backgroundColor: theme.primary, borderColor: theme.primary }
                            : { backgroundColor: "transparent", borderColor: theme.border },
                        ]}
                      >
                        {isDone ? <Ionicons name="checkmark" size={12} color={theme.background} /> : null}
                      </View>
                      <View>
                        <ThemedText style={styles.exerciseTitle}>{exercise.displayName}</ThemedText>
                        <ThemedText style={[styles.exerciseSubline, { color: theme.textSecondary }]}>
                          {completedSets}/{totalSets} sets complete
                        </ThemedText>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.demoButton, { backgroundColor: theme.background }]}
                      activeOpacity={exercise.apiId ? 0.8 : 1}
                      onPress={() => openDemo(exercise)}
                    >
                      <Ionicons
                        name={exercise.apiId ? "play" : "remove"}
                        size={14}
                        color={exercise.apiId ? theme.primary : theme.textSecondary}
                        />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.exerciseCompleteButton,
                      isDone
                        ? { backgroundColor: theme.primary, borderColor: theme.primary }
                        : { backgroundColor: "transparent", borderColor: theme.border },
                    ]}
                    activeOpacity={0.85}
                    onPress={() => handleToggleExercise(exercise.key)}
                  >
                    <Ionicons
                      name={isDone ? "checkmark-circle" : "ellipse-outline"}
                      size={14}
                      color={isDone ? theme.background : theme.textSecondary}
                    />
                    <ThemedText
                      style={[
                        styles.exerciseCompleteButtonText,
                        { color: isDone ? theme.background : theme.textSecondary },
                      ]}
                    >
                      {isDone ? "Completed" : "Mark Done"}
                    </ThemedText>
                  </TouchableOpacity>

                  <View style={styles.exerciseChips}>
                    <View style={[styles.exerciseChip, { backgroundColor: theme.background }]}>
                      <ThemedText style={[styles.exerciseChipText, { color: theme.textSecondary }]}>
                        {exercise.plannedSets} x {exercise.plannedReps}
                      </ThemedText>
                    </View>
                    <View style={[styles.exerciseChip, { backgroundColor: theme.background }]}>
                      <ThemedText style={[styles.exerciseChipText, { color: theme.primary }]}>{exercise.plannedLoad}</ThemedText>
                    </View>
                    {exercise.target ? (
                      <View style={[styles.exerciseChip, { backgroundColor: theme.background }]}>
                        <ThemedText style={[styles.exerciseChipText, { color: theme.textSecondary }]}>
                          {toLabel(exercise.target)}
                        </ThemedText>
                      </View>
                    ) : null}
                  </View>

                  {exercise.setLogs.map((setLog) => (
                    <View key={`${exercise.key}-${setLog.setNumber}`} style={[styles.setRow, { borderColor: theme.border }]}>
                      <View style={styles.setLabelWrap}>
                        <ThemedText style={styles.setLabel}>Set {setLog.setNumber}</ThemedText>
                        <ThemedText style={[styles.setPlan, { color: theme.textSecondary }]}>
                          Plan: {setLog.plannedReps} reps
                        </ThemedText>
                      </View>

                      <View style={styles.inputWrap}>
                        <TextInput
                          style={[
                            styles.input,
                            {
                              color: theme.text,
                              backgroundColor: theme.background,
                              borderColor: theme.border,
                            },
                          ]}
                          keyboardType="numeric"
                          value={setLog.actualReps}
                          onChangeText={(value) => handleSetField(exercise.key, setLog.setNumber, "actualReps", value)}
                          placeholder={String(setLog.plannedReps)}
                          placeholderTextColor={theme.textSecondary}
                        />
                        <ThemedText style={[styles.inputSuffix, { color: theme.textSecondary }]}>reps</ThemedText>
                      </View>

                      <View style={styles.inputWrap}>
                        <TextInput
                          style={[
                            styles.input,
                            {
                              color: theme.text,
                              backgroundColor: theme.background,
                              borderColor: theme.border,
                            },
                          ]}
                          keyboardType="numeric"
                          value={setLog.actualWeight}
                          onChangeText={(value) =>
                            handleSetField(exercise.key, setLog.setNumber, "actualWeight", value)
                          }
                          placeholder={setLog.plannedWeight}
                          placeholderTextColor={theme.textSecondary}
                        />
                        <ThemedText style={[styles.inputSuffix, { color: theme.textSecondary }]}>lbs</ThemedText>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.completeButton,
                          setLog.completed
                            ? { backgroundColor: theme.primary, borderColor: theme.primary }
                            : { backgroundColor: "transparent", borderColor: theme.border },
                        ]}
                        onPress={() => handleToggleSet(exercise.key, setLog.setNumber)}
                        activeOpacity={0.85}
                      >
                        {setLog.completed ? <Ionicons name="checkmark" size={14} color={theme.background} /> : null}
                      </TouchableOpacity>
                    </View>
                  ))}

                  <TextInput
                    value={exercise.note}
                    onChangeText={(value) => handleExerciseNote(exercise.key, value)}
                    multiline={true}
                    placeholder="Optional note (e.g. slight pain in left knee on set 2)."
                    placeholderTextColor={theme.textSecondary}
                    style={[
                      styles.noteInput,
                      {
                        color: theme.text,
                        backgroundColor: theme.background,
                        borderColor: theme.border,
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>

          <View style={[styles.workoutNoteCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <ThemedText style={styles.workoutNoteTitle}>Session Note</ThemedText>
            <TextInput
              value={plan?.workoutNote || ""}
              onChangeText={handleWorkoutNote}
              multiline={true}
              placeholder="How did the session feel overall?"
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.workoutNoteInput,
                {
                  color: theme.text,
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}
            />
          </View>

          <TouchableOpacity
            style={[styles.finishButton, { backgroundColor: theme.primary }]}
            activeOpacity={0.85}
            onPress={finishWorkout}
          >
            <Ionicons name="checkmark-done" size={16} color="#ffffff" />
            <ThemedText style={styles.finishButtonText}>Finish Workout</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
};

export default WorkoutSession;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  topBar: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  finishTopButton: {
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  finishTopText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "700",
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
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  progressTrack: {
    marginTop: 10,
    height: 8,
    borderRadius: 99,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 99,
  },
  metaRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    rowGap: 4,
  },
  metaText: {
    fontSize: 11,
  },
  exerciseList: {
    marginTop: 18,
    gap: 14,
  },
  exerciseCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exerciseHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  exerciseStatusDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  exerciseTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  exerciseSubline: {
    marginTop: 2,
    fontSize: 11,
  },
  demoButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  exerciseCompleteButton: {
    marginTop: 10,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
  },
  exerciseCompleteButtonText: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: "700",
  },
  exerciseChips: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 8,
  },
  exerciseChip: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  exerciseChipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  setRow: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  setLabelWrap: {
    width: 78,
  },
  setLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  setPlan: {
    marginTop: 2,
    fontSize: 10,
  },
  inputWrap: {
    marginLeft: 10,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
    flex: 1,
  },
  inputSuffix: {
    marginLeft: 6,
    fontSize: 10,
  },
  completeButton: {
    marginLeft: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  noteInput: {
    marginTop: 10,
    minHeight: 68,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    textAlignVertical: "top",
  },
  workoutNoteCard: {
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  workoutNoteTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  workoutNoteInput: {
    marginTop: 10,
    minHeight: 80,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    textAlignVertical: "top",
  },
  finishButton: {
    marginTop: 18,
    height: 46,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  finishButtonText: {
    marginLeft: 8,
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});
