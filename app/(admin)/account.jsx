import { StyleSheet, View, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import ThemedButton from "../../components/ThemedButton";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../hooks/useUser";

const withAlpha = (color, alpha = "1f") =>
  typeof color === "string" && color.startsWith("#") && color.length === 7 ? `${color}${alpha}` : color;

const Account = () => {
  const { theme, mode, toggleTheme } = useTheme();
  const { user, profile, role, logout } = useUser();
  const router = useRouter();

  return (
    <ThemedView style={styles.container} safe={true} safeBottom={false}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.title}>Admin Account</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Access, permissions, and account actions.
        </ThemedText>

        <View style={[styles.profileCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={[styles.avatar, { backgroundColor: withAlpha(theme.primary, "22") }]}>
            <MaterialCommunityIcons name="shield-account" size={22} color={theme.primary} />
          </View>
          <View style={styles.profileInfo}>
            <ThemedText style={styles.name}>
              {profile?.first_name || "Coach"} {profile?.last_name || ""}
            </ThemedText>
            <ThemedText style={[styles.email, { color: theme.textSecondary }]}>{user?.email || "-"}</ThemedText>
            <View style={[styles.roleChip, { backgroundColor: withAlpha(theme.primary, "1f") }]}>
              <ThemedText style={[styles.roleChipText, { color: theme.primary }]}>
                {role === "admin" ? "Administrator" : "Trainer"}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.rowButton, { borderColor: theme.border }]}
            activeOpacity={0.85}
            onPress={toggleTheme}
          >
            <View style={[styles.rowIcon, { backgroundColor: theme.background }]}>
              <Ionicons name={mode === "dark" ? "sunny" : "moon"} size={16} color={theme.primary} />
            </View>
            <View style={styles.rowInfo}>
              <ThemedText style={styles.rowTitle}>Theme</ThemedText>
              <ThemedText style={[styles.rowHint, { color: theme.textSecondary }]}>
                Switch between dark and light mode
              </ThemedText>
            </View>
            <ThemedText style={[styles.rowRight, { color: theme.primary }]}>{mode === "dark" ? "Light" : "Dark"}</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rowButton, { borderColor: theme.border }]}
            activeOpacity={0.85}
            onPress={() => router.push("/(admin)/clients")}
          >
            <View style={[styles.rowIcon, { backgroundColor: theme.background }]}>
              <Ionicons name="people" size={16} color={theme.primary} />
            </View>
            <View style={styles.rowInfo}>
              <ThemedText style={styles.rowTitle}>Manage Clients</ThemedText>
              <ThemedText style={[styles.rowHint, { color: theme.textSecondary }]}>
                Open full roster, assignment and delete actions
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <ThemedButton
          style={styles.logoutButton}
          onPress={async () => {
            await logout();
            router.replace("/login");
          }}
        >
          <ThemedText style={styles.logoutText}>Log Out</ThemedText>
        </ThemedButton>
      </ScrollView>
    </ThemedView>
  );
};

export default Account;

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
  profileCard: {
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
  },
  email: {
    marginTop: 2,
    fontSize: 12,
  },
  roleChip: {
    marginTop: 8,
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  card: {
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  rowButton: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  rowInfo: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  rowHint: {
    marginTop: 2,
    fontSize: 11,
  },
  rowRight: {
    fontSize: 12,
    fontWeight: "700",
  },
  logoutButton: {
    marginTop: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  logoutText: {
    color: "#ffffff",
    fontWeight: "700",
  },
});
