import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../hooks/useUser";
import { loadAdminOverview } from "../../services/admin";

const withAlpha = (color, alpha = "1f") =>
  typeof color === "string" && color.startsWith("#") && color.length === 7 ? `${color}${alpha}` : color;

const Overview = () => {
  const { theme } = useTheme();
  const { user, role } = useUser();
  const router = useRouter();

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const load = async () => {
        try {
          setLoading(true);
          setError("");
          const next = await loadAdminOverview(user?.id, role);
          if (active) setOverview(next);
        } catch (e) {
          if (active) setError(e?.message || "Could not load admin overview.");
        } finally {
          if (active) setLoading(false);
        }
      };

      load();
      return () => {
        active = false;
      };
    }, [user?.id, role])
  );

  return (
    <ThemedView style={styles.container} safe={true} safeBottom={false}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <ThemedText style={styles.title}>Admin Overview</ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              Coach activity, weekly numbers, and top clients.
            </ThemedText>
          </View>
          <View style={[styles.headerBadge, { backgroundColor: withAlpha(theme.primary, "20") }]}>
            <ThemedText style={[styles.headerBadgeText, { color: theme.primary }]}>
              {role === "admin" ? "Admin" : "Trainer"}
            </ThemedText>
          </View>
        </View>

        {loading ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : null}
        {!loading && error ? <ThemedText style={[styles.errorText, { color: theme.error }]}>{error}</ThemedText> : null}

        {!loading && !error ? (
          <>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="account-group" size={18} color={theme.primary} />
                <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Clients</ThemedText>
                <ThemedText style={styles.statValue}>{overview?.totalClients || 0}</ThemedText>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="run-fast" size={18} color={theme.primary} />
                <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Active (14d)</ThemedText>
                <ThemedText style={styles.statValue}>{overview?.activeClients || 0}</ThemedText>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="calendar-week" size={18} color={theme.primary} />
                <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Sessions / Week</ThemedText>
                <ThemedText style={styles.statValue}>{overview?.sessionsThisWeek || 0}</ThemedText>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="chart-line-variant" size={18} color={theme.primary} />
                <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Avg Completion</ThemedText>
                <ThemedText style={styles.statValue}>{overview?.avgCompletionThisWeek || 0}%</ThemedText>
              </View>
            </View>

            <View style={[styles.quickCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
              <View style={styles.quickRow}>
                <TouchableOpacity
                  style={[styles.quickButton, { backgroundColor: theme.primary }]}
                  activeOpacity={0.85}
                  onPress={() => router.push("/(admin)/clients")}
                >
                  <Ionicons name="people" size={14} color="#ffffff" />
                  <ThemedText style={styles.quickButtonText}>Manage Clients</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickButton, { backgroundColor: theme.background, borderColor: theme.border }]}
                  activeOpacity={0.85}
                  onPress={() => router.push("/(admin)/assign")}
                >
                  <Ionicons name="add-circle" size={14} color={theme.primary} />
                  <ThemedText style={[styles.quickButtonText, { color: theme.primary }]}>Assign Exercise</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.listCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <ThemedText style={styles.sectionTitle}>Top Clients</ThemedText>
              {(overview?.topClients || []).length ? (
                (overview.topClients || []).map((client, index) => (
                  <View key={client.id} style={[styles.clientRow, { borderColor: theme.border }]}>
                    <View style={[styles.rankDot, { backgroundColor: withAlpha(theme.primary, "20") }]}>
                      <ThemedText style={[styles.rankText, { color: theme.primary }]}>{index + 1}</ThemedText>
                    </View>
                    <View style={styles.clientInfo}>
                      <ThemedText style={styles.clientName}>{client.fullName}</ThemedText>
                      <ThemedText style={[styles.clientMeta, { color: theme.textSecondary }]}>
                        {client.sessions} sessions - Best {client.bestLoad || 0} lbs
                      </ThemedText>
                    </View>
                  </View>
                ))
              ) : (
                <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No client session data yet.
                </ThemedText>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
};

export default Overview;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerRow: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
  },
  headerBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  stateWrap: {
    marginTop: 20,
    alignItems: "center",
  },
  errorText: {
    marginTop: 12,
    fontSize: 12,
  },
  statsGrid: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  statCard: {
    width: "48%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  statLabel: {
    marginTop: 8,
    fontSize: 11,
  },
  statValue: {
    marginTop: 4,
    fontSize: 19,
    fontWeight: "700",
  },
  quickCard: {
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  quickRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickButton: {
    width: "48%",
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  quickButtonText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  listCard: {
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  clientRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  rankDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    fontSize: 12,
    fontWeight: "700",
  },
  clientInfo: {
    marginLeft: 10,
    flex: 1,
  },
  clientName: {
    fontSize: 14,
    fontWeight: "700",
  },
  clientMeta: {
    marginTop: 2,
    fontSize: 11,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 12,
  },
});
