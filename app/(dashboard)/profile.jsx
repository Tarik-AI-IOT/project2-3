import { StyleSheet, View, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import ThemedView from "../../components/ThemedView";
import { useTheme } from "../../context/ThemeContext";
import ThemedText from "../../components/ThemedText";
import ThemedButton from "../../components/ThemedButton";
import { useUser } from "../../hooks/useUser";

const infoRows = [
  { label: "Age", value: "28 years" },
  { label: "Height", value: "5'10\"" },
  { label: "Current Weight", value: "174 lbs" },
  { label: "Fitness Goal", value: "Lose weight & build muscle" },
];

const Profile = () => {
  const { theme, mode, toggleTheme } = useTheme();
  const router = useRouter();
  const { logout } = useUser();

  return (
    <ThemedView style={styles.container} safe={true}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[styles.circleButton, { backgroundColor: theme.cardBackground }]}
            accessibilityLabel="Go back"
            activeOpacity={0.8}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={18} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.topActions}>
            <TouchableOpacity
              style={[
                styles.editButton,
                { backgroundColor: theme.cardBackground, borderColor: theme.border },
              ]}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="pencil"
                size={16}
                color={theme.primary}
                style={styles.editIcon}
              />
              <ThemedText style={[styles.editText, { color: theme.primary }]}>
                Edit
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                { backgroundColor: theme.cardBackground, borderColor: theme.border },
              ]}
              activeOpacity={0.8}
              onPress={toggleTheme}
              accessibilityLabel="Toggle theme"
            >
              <Ionicons
                name={mode === "dark" ? "sunny" : "moon"}
                size={16}
                color={theme.primary}
                style={styles.editIcon}
              />
              <ThemedText style={[styles.editText, { color: theme.primary }]}>
                {mode === "dark" ? "Light" : "Dark"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.profileHeader}>
          <View style={[styles.avatarRing, { backgroundColor: theme.cardBackground }]}>
            <View style={[styles.avatarInner, { backgroundColor: theme.background }]}>
              <Ionicons name="person" size={32} color={theme.primary} />
            </View>
          </View>
          <ThemedText style={styles.name}>Alex Johnson</ThemedText>
        </View>

        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              styles.statCardLeft,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            <View style={[styles.statIcon, { backgroundColor: theme.background }]}>
              <MaterialCommunityIcons
                name="chart-line-variant"
                size={18}
                color={theme.primary}
              />
            </View>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Weight Lost
            </ThemedText>
            <ThemedText style={styles.statValue}>4 lbs</ThemedText>
            <ThemedText style={[styles.statNote, { color: theme.primary }]}>
              -2.2% from start
            </ThemedText>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <View style={[styles.statIcon, { backgroundColor: theme.background }]}>
              <MaterialCommunityIcons
                name="calendar-check"
                size={18}
                color={theme.primary}
              />
            </View>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Workouts
            </ThemedText>
            <ThemedText style={styles.statValue}>24</ThemedText>
            <ThemedText style={[styles.statNote, { color: theme.primary }]}>
              This month
            </ThemedText>
          </View>
        </View>

        <ThemedText style={styles.sectionTitle}>Personal Information</ThemedText>

        <View
          style={[
            styles.infoCard,
            { backgroundColor: theme.cardBackground, borderColor: theme.border },
          ]}
        >
          {infoRows.map((row, index) => (
            <View
              key={row.label}
              style={[
                styles.infoRow,
                index === infoRows.length - 1 && styles.infoRowLast,
                { borderColor: theme.border },
              ]}
            >
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>
                {row.label}
              </ThemedText>
              <ThemedText style={styles.infoValue}>{row.value}</ThemedText>
            </View>
          ))}
        </View>

        <ThemedButton
          style={styles.logoutButton}
          onPress={async () => {
            await logout();
            router.replace("/login");
          }}
        >
          <ThemedText style={styles.logoutText}>Log out</ThemedText>
        </ThemedButton>
      </ScrollView>
    </ThemedView>
  );
};

export default Profile;

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
  topActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    marginLeft: 10,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    marginLeft: 10,
  },
  editIcon: {
    marginRight: 6,
  },
  editText: {
    fontSize: 14,
    fontWeight: "600",
  },
  profileHeader: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 18,
  },
  avatarRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  statCardLeft: {
    marginRight: 14,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    minHeight: 130,
    justifyContent: "space-between",
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    marginTop: 12,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statNote: {
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 16,
    fontWeight: "700",
  },
  infoCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  infoRow: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  infoValue: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: "600",
  },
  logoutButton: {
    marginTop: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  logoutText: {
    color: "#ffffff",
    fontWeight: "600",
  },
});
