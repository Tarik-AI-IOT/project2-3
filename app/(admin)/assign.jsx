import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import ThemedButton from "../../components/ThemedButton";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../hooks/useUser";
import { assignExerciseToClient, getTodayDateKey, loadManagedClients } from "../../services/admin";

const QUICK_EXERCISES = [
  { name: "Barbell Squat", sets: "4", reps: "8", load: "185 lbs" },
  { name: "Bench Press", sets: "4", reps: "8", load: "135 lbs" },
  { name: "Deadlift", sets: "3", reps: "5", load: "225 lbs" },
  { name: "Lat Pulldown", sets: "3", reps: "12", load: "90 lbs" },
];

const Assign = () => {
  const { theme } = useTheme();
  const { user, role } = useUser();
  const params = useLocalSearchParams();

  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedClientId, setSelectedClientId] = useState("");
  const [dateKey, setDateKey] = useState(getTodayDateKey());
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const [load, setLoad] = useState("Bodyweight");
  const [note, setNote] = useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const loadClients = async () => {
        try {
          setLoadingClients(true);
          setError("");
          const nextClients = await loadManagedClients(user?.id, role);
          if (!active) return;
          setClients(nextClients);

          const preferredId = String(params?.clientId || "");
          const exists = nextClients.some((client) => client.id === preferredId);
          if (exists) {
            setSelectedClientId(preferredId);
          } else if (nextClients.length && !selectedClientId) {
            setSelectedClientId(nextClients[0].id);
          }
        } catch (e) {
          if (active) setError(e?.message || "Could not load clients.");
        } finally {
          if (active) setLoadingClients(false);
        }
      };

      loadClients();
      return () => {
        active = false;
      };
    }, [params?.clientId, role, selectedClientId, user?.id])
  );

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  const pickTemplate = (template) => {
    setExerciseName(template.name);
    setSets(template.sets);
    setReps(template.reps);
    setLoad(template.load);
  };

  const handleAssign = async () => {
    if (!selectedClientId) {
      setError("Select a client first.");
      return;
    }
    if (!exerciseName.trim()) {
      setError("Exercise name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await assignExerciseToClient({
        clientId: selectedClientId,
        dateKey,
        exercise: {
          name: exerciseName,
          sets,
          reps,
          load,
          note,
        },
      });
      setSuccess(`Exercise assigned to ${selectedClient?.fullName || "client"} for ${dateKey}.`);
      setNote("");
    } catch (e) {
      setError(e?.message || "Could not assign exercise.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container} safe={true} safeBottom={false}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.title}>Assign Exercises</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Push a workout item directly into a client daily plan.
        </ThemedText>

        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <ThemedText style={styles.sectionTitle}>1) Select Client</ThemedText>
          {loadingClients ? (
            <View style={styles.stateWrap}>
              <ActivityIndicator color={theme.primary} />
            </View>
          ) : null}

          {!loadingClients ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.clientChipsRow}>
              {clients.map((client) => {
                const selected = client.id === selectedClientId;
                return (
                  <TouchableOpacity
                    key={client.id}
                    style={[
                      styles.clientChip,
                      selected
                        ? { backgroundColor: theme.primary, borderColor: theme.primary }
                        : { backgroundColor: theme.background, borderColor: theme.border },
                    ]}
                    onPress={() => setSelectedClientId(client.id)}
                    activeOpacity={0.85}
                  >
                    <ThemedText style={[styles.clientChipText, { color: selected ? "#ffffff" : theme.textSecondary }]}>
                      {client.fullName}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : null}
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <ThemedText style={styles.sectionTitle}>2) Exercise Template</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateRow}>
            {QUICK_EXERCISES.map((template) => (
              <TouchableOpacity
                key={template.name}
                style={[styles.templateChip, { borderColor: theme.border, backgroundColor: theme.background }]}
                activeOpacity={0.85}
                onPress={() => pickTemplate(template)}
              >
                <Ionicons name="sparkles" size={12} color={theme.primary} />
                <ThemedText style={[styles.templateChipText, { color: theme.textSecondary }]}>{template.name}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <ThemedText style={styles.sectionTitle}>3) Exercise Details</ThemedText>

          <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Date (YYYY-MM-DD)</ThemedText>
          <TextInput
            value={dateKey}
            onChangeText={setDateKey}
            placeholder="2026-03-03"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
          />

          <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Exercise Name</ThemedText>
          <TextInput
            value={exerciseName}
            onChangeText={setExerciseName}
            placeholder="e.g. Incline Dumbbell Press"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
          />

          <View style={styles.inlineRow}>
            <View style={styles.inlineCol}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Sets</ThemedText>
              <TextInput
                value={sets}
                onChangeText={setSets}
                keyboardType="number-pad"
                style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
              />
            </View>
            <View style={styles.inlineCol}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Reps</ThemedText>
              <TextInput
                value={reps}
                onChangeText={setReps}
                keyboardType="number-pad"
                style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
              />
            </View>
            <View style={styles.inlineCol}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Load</ThemedText>
              <TextInput
                value={load}
                onChangeText={setLoad}
                placeholder="135 lbs"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
              />
            </View>
          </View>

          <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Coach Note (optional)</ThemedText>
          <TextInput
            value={note}
            onChangeText={setNote}
            multiline={true}
            placeholder="Technique cue, pain warning, or tempo instruction."
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.noteInput,
              { backgroundColor: theme.background, borderColor: theme.border, color: theme.text },
            ]}
          />
        </View>

        <ThemedButton style={styles.assignButton} onPress={handleAssign} disabled={saving}>
          <ThemedText style={styles.assignButtonText}>{saving ? "Assigning..." : "Assign Exercise"}</ThemedText>
        </ThemedButton>

        {error ? <ThemedText style={[styles.message, { color: theme.error }]}>{error}</ThemedText> : null}
        {success ? <ThemedText style={[styles.message, { color: theme.primary }]}>{success}</ThemedText> : null}
      </ScrollView>
    </ThemedView>
  );
};

export default Assign;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  title: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
  },
  card: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  stateWrap: {
    marginTop: 10,
    alignItems: "center",
  },
  clientChipsRow: {
    paddingTop: 10,
    paddingRight: 4,
  },
  clientChip: {
    height: 33,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  clientChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  templateRow: {
    paddingTop: 10,
    paddingRight: 4,
  },
  templateChip: {
    borderRadius: 999,
    borderWidth: 1,
    height: 32,
    paddingHorizontal: 10,
    marginRight: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  templateChipText: {
    marginLeft: 5,
    fontSize: 11,
    fontWeight: "600",
  },
  inputLabel: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 11,
  },
  input: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  inlineRow: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inlineCol: {
    width: "31.5%",
  },
  noteInput: {
    minHeight: 74,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 12,
    textAlignVertical: "top",
  },
  assignButton: {
    marginTop: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  assignButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  message: {
    marginTop: 10,
    fontSize: 12,
  },
});
