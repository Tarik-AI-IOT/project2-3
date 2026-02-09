import { StyleSheet, Text, Button } from "react-native";
import { Link } from "expo-router";
import ThemedView from "../../components/ThemedView";
import { useTheme } from "../../context/ThemeContext";
import ThemedText from "../../components/ThemedText";
import Spacer from "../../components/Spacer";

const Profile = () => {
  const { theme, mode, toggleTheme } = useTheme();

  return (
    <ThemedView style={styles.container}>
      <ThemedText title>Profile Page</ThemedText>
      <Spacer height={20} />
      <Button
        title={mode === "dark" ? "☀️ Light mode" : "🌙 Dark mode"}
        onPress={toggleTheme}
        color={theme.primary}
      />

      <Link href="/" style={styles.link}>
        <ThemedText>Back Home</ThemedText>
      </Link>
    </ThemedView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  link: {
    marginVertical: 10,
    borderBottomWidth: 1,
  },
});
