import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import ThemedView from "../../../components/ThemedView";
import ThemedText from "../../../components/ThemedText";
import { useTheme } from "../../../context/ThemeContext";
import { buildClientSummaryFromHistory, loadClientById, loadClientWorkoutHistory } from "../../../services/admin";

const withAlpha = (color, alpha = "1f") =>
  typeof color === "string" && color.startsWith("#") && color.length === 7 ? `${color}${alpha}` : color;

const ClientDetail = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const clientId = String(params?.id || "");

  const [client, setClient] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        try {
          setLoading(true);
          setError("");
          const [nextClient, nextHistory] = await Promise.all([
            loadClientById(clientId),
            loadClientWorkoutHistory(clientId, 18),
          ]);
          if (!active) return;
          setClient(nextClient);
          setHistory(nextHistory);
        } catch (e) {
          if (active) setError(e?.message || "Could not load client results.");
        } finally {
          if (active) setLoading(false);
        }
      };

      load();
      return () => {
        active = false;
      };
    }, [clientId])
  );

  const summary = useMemo(() => buildClientSummaryFromHistory(history), [history]);

  return (
    <ThemedView style={styles.container} safe={true} safeBottom={false}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[styles.circleButton, { backgroundColor: theme.cardBackground }]}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={18} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ThemedText style={styles.title}>{client?.fullName || "Client Results"}</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Session consistency, completion, and top load progression.
        </ThemedText>

        {loading ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : null}
        {!loading && error ? <ThemedText style={[styles.errorText, { color: theme.error }]}>{error}</ThemedText> : null}

        {!loading && !error ? (
          <>
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="calendar-check" size={18} color={theme.primary} />
                <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Sessions</ThemedText>
                <ThemedText style={styles.statValue}>{summary.totalSessions}</ThemedText>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="check-decagram" size={18} color={theme.primary} />
                <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Avg Completion</ThemedText>
                <ThemedText style={styles.statValue}>{summary.avgCompletion}%</ThemedText>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="trophy-outline" size={18} color={theme.primary} />
                <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Best Max</ThemedText>
                <ThemedText style={styles.statValue}>{summary.bestLoad} lbs</ThemedText>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="clock-outline" size={18} color={theme.primary} />
                <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Latest</ThemedText>
                <ThemedText style={styles.statValue}>{summary.latestDate}</ThemedText>
              </View>
            </View>

            <View style={[styles.historyCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <ThemedText style={styles.sectionTitle}>Recent Sessions</ThemedText>

              {history.length ? (
                history
                  .slice()
                  .reverse()
                  .slice(0, 12)
                  .map((session) => (
                    <View key={session.dateKey} style={[styles.sessionRow, { borderColor: theme.border }]}>
                      <View style={styles.sessionLeft}>
                        <View style={[styles.dateDot, { backgroundColor: withAlpha(theme.primary, "22") }]}>
                          <ThemedText style={[styles.dateDotText, { color: theme.primary }]}>
                            {session.dateLabel.split(" ")[0]}
                          </ThemedText>
                        </View>
                        <View style={styles.sessionInfo}>
                          <ThemedText style={styles.sessionDate}>{session.dateLabel}</ThemedText>
                          <ThemedText style={[styles.sessionMeta, { color: theme.textSecondary }]}>
                            {Math.round(session.completionRate * 100)}% - {session.completedSets}/{session.totalSets} sets
                          </ThemedText>
                        </View>
                      </View>
                      <View style={styles.sessionRight}>
                        <ThemedText style={styles.sessionWeight}>{session.topWeight || 0} lbs</ThemedText>
                        <ThemedText style={[styles.sessionMeta, { color: theme.textSecondary }]}>Top load</ThemedText>
                      </View>
                    </View>
                  ))
              ) : (
                <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No workout history for this client yet.
                </ThemedText>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
};

export default ClientDetail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  topBar: {
    marginTop: 6,
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 14,
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
  },
  stateWrap: {
    marginTop: 14,
    alignItems: "center",
  },
  errorText: {
    marginTop: 12,
    fontSize: 12,
  },
  statsRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  statLabel: {
    marginTop: 8,
    fontSize: 11,
  },
  statValue: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "700",
  },
  historyCard: {
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  sessionRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sessionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dateDot: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dateDotText: {
    fontSize: 10,
    fontWeight: "700",
  },
  sessionInfo: {
    marginLeft: 10,
    flex: 1,
  },
  sessionDate: {
    fontSize: 13,
    fontWeight: "700",
  },
  sessionMeta: {
    marginTop: 2,
    fontSize: 11,
  },
  sessionRight: {
    alignItems: "flex-end",
  },
  sessionWeight: {
    fontSize: 13,
    fontWeight: "700",
  },
  emptyText: {
    marginTop: 10,
    fontSize: 12,
  },
});
