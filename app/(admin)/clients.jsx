import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native";
import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../hooks/useUser";
import { assignClientToTrainer, deleteClientAccountData, loadManagedClients } from "../../services/admin";

const withAlpha = (color, alpha = "1f") =>
  typeof color === "string" && color.startsWith("#") && color.length === 7 ? `${color}${alpha}` : color;

const Clients = () => {
  const { theme } = useTheme();
  const { user, role } = useUser();
  const router = useRouter();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [busyClientId, setBusyClientId] = useState("");

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const next = await loadManagedClients(user?.id, role);
      setClients(next);
    } catch (e) {
      setError(e?.message || "Could not load clients.");
    } finally {
      setLoading(false);
    }
  }, [role, user?.id]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter((client) =>
      `${client.fullName} ${client.goal || ""}`.toLowerCase().includes(query)
    );
  }, [clients, search]);

  const handleTakeClient = async (clientId) => {
    try {
      setBusyClientId(clientId);
      await assignClientToTrainer({ clientId, trainerId: user?.id });
      await reload();
    } catch (e) {
      setError(e?.message || "Could not assign this client.");
    } finally {
      setBusyClientId("");
    }
  };

  const handleDeleteClient = (client) => {
    Alert.alert(
      "Delete client account data",
      `This will remove ${client.fullName}'s profile and workout data.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setBusyClientId(client.id);
              setError("");
              await deleteClientAccountData(client.id);
              await reload();
            } catch (e) {
              setError(e?.message || "Could not delete client data.");
            } finally {
              setBusyClientId("");
            }
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container} safe={true} safeBottom={false}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.title}>Client Manager</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Assign plans, monitor results, and maintain your roster.
        </ThemedText>

        <View style={[styles.searchRow, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Ionicons name="search" size={16} color={theme.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by client name or goal"
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
          />
        </View>

        {loading ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : null}
        {!loading && error ? <ThemedText style={[styles.errorText, { color: theme.error }]}>{error}</ThemedText> : null}

        {!loading && !error && filteredClients.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <ThemedText style={styles.emptyTitle}>No clients found</ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              {role === "admin"
                ? "No customer profile is available yet."
                : "No clients are assigned to you yet."}
            </ThemedText>
          </View>
        ) : null}

        {filteredClients.map((client) => {
          const busy = busyClientId === client.id;
          const latest = client.latestSession;
          return (
            <View
              key={client.id}
              style={[
                styles.clientCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.clientHeader}>
                <View style={[styles.avatar, { backgroundColor: withAlpha(theme.primary, "22") }]}>
                  <MaterialCommunityIcons name="account" size={18} color={theme.primary} />
                </View>
                <View style={styles.clientNameWrap}>
                  <ThemedText style={styles.clientName}>{client.fullName}</ThemedText>
                  <ThemedText style={[styles.clientMeta, { color: theme.textSecondary }]}>
                    {client.goal || "No goal set"}
                  </ThemedText>
                </View>
                {client.weight ? (
                  <View style={[styles.weightBadge, { backgroundColor: theme.background }]}>
                    <ThemedText style={[styles.weightText, { color: theme.primary }]}>
                      {client.weight} {client.weight_unit || ""}
                    </ThemedText>
                  </View>
                ) : null}
              </View>

              <View style={[styles.latestCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <ThemedText style={[styles.latestLabel, { color: theme.textSecondary }]}>Latest Session</ThemedText>
                <ThemedText style={styles.latestValue}>
                  {latest ? `${latest.dateLabel} - ${Math.round((latest.completionRate || 0) * 100)}%` : "No workouts yet"}
                </ThemedText>
                {latest ? (
                  <ThemedText style={[styles.latestSub, { color: theme.textSecondary }]}>
                    {latest.completedSets}/{latest.totalSets} sets - Max {latest.topWeight || 0} lbs
                  </ThemedText>
                ) : null}
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.primary }]}
                  activeOpacity={0.85}
                  onPress={() => router.push({ pathname: "/(admin)/assign", params: { clientId: client.id } })}
                >
                  <Ionicons name="add" size={14} color="#ffffff" />
                  <ThemedText style={styles.actionText}>Assign</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.background, borderColor: theme.border }]}
                  activeOpacity={0.85}
                  onPress={() => router.push(`/(admin)/client/${client.id}`)}
                >
                  <Ionicons name="bar-chart" size={14} color={theme.primary} />
                  <ThemedText style={[styles.actionText, { color: theme.primary }]}>Results</ThemedText>
                </TouchableOpacity>
              </View>

              <View style={styles.bottomRow}>
                {role === "admin" ? (
                  <TouchableOpacity
                    style={[styles.bottomAction, { borderColor: theme.border, backgroundColor: theme.background }]}
                    activeOpacity={0.85}
                    disabled={busy}
                    onPress={() => handleTakeClient(client.id)}
                  >
                    <Ionicons name="person-add" size={14} color={theme.textSecondary} />
                    <ThemedText style={[styles.bottomActionText, { color: theme.textSecondary }]}>
                      {busy ? "Saving..." : "Assign To Me"}
                    </ThemedText>
                  </TouchableOpacity>
                ) : (
                  <View />
                )}

                <TouchableOpacity
                  style={[styles.bottomAction, { borderColor: withAlpha(theme.error, "60"), backgroundColor: theme.background }]}
                  activeOpacity={0.85}
                  disabled={busy}
                  onPress={() => handleDeleteClient(client)}
                >
                  <Ionicons name="trash" size={14} color={theme.error} />
                  <ThemedText style={[styles.bottomActionText, { color: theme.error }]}>
                    {busy ? "Deleting..." : "Delete Client"}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </ThemedView>
  );
};

export default Clients;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
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
  searchRow: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    height: 42,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    fontSize: 13,
  },
  stateWrap: {
    marginTop: 16,
    alignItems: "center",
  },
  errorText: {
    marginTop: 12,
    fontSize: 12,
  },
  emptyCard: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  emptyText: {
    marginTop: 4,
    fontSize: 12,
  },
  clientCard: {
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  clientHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  clientNameWrap: {
    marginLeft: 10,
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    fontWeight: "700",
  },
  clientMeta: {
    marginTop: 2,
    fontSize: 11,
  },
  weightBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  weightText: {
    fontSize: 11,
    fontWeight: "700",
  },
  latestCard: {
    marginTop: 12,
    borderRadius: 13,
    borderWidth: 1,
    padding: 10,
  },
  latestLabel: {
    fontSize: 10,
  },
  latestValue: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: "700",
  },
  latestSub: {
    marginTop: 2,
    fontSize: 11,
  },
  actionRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    width: "48%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  bottomRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bottomAction: {
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 32,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomActionText: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: "600",
  },
});
