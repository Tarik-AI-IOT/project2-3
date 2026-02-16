import { StyleSheet, Image, TouchableOpacity, View } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import ThemedButton from "../../components/ThemedButton";
import Spacer from "../../components/Spacer";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../hooks/useUser";

const CheckEmail = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, pendingSignup, login, clearPendingSignup } = useUser();
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (user) {
      clearPendingSignup();
      router.replace("/(dashboard)/home");
    }
  }, [user, clearPendingSignup, router]);

  const handleVerified = async () => {
    if (!pendingSignup?.email || !pendingSignup?.password) {
      router.replace("/login");
      return;
    }
    setChecking(true);
    setError("");
    try {
      await login(pendingSignup.email, pendingSignup.password);
      clearPendingSignup();
      router.replace("/(dashboard)/home");
    } catch (e) {
      setError("Not verified yet. Please check your email and try again.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <ThemedView style={styles.container} safe={true}>
      <View style={styles.card}>
        <Image source={require("../../assets/rofit.png")} style={styles.logo} />
        <Spacer height={20} />
        <ThemedText title style={styles.title}>
          Check your email
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          We sent you a confirmation link. Please verify your email to continue.
        </ThemedText>

        {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

        <Spacer height={20} />
        <ThemedButton onPress={handleVerified} disabled={checking}>
          <ThemedText>{checking ? "Checking..." : "I've verified"}</ThemedText>
        </ThemedButton>

        <Spacer height={20} />
        <TouchableOpacity onPress={() => router.replace("/login")}>
          <ThemedText style={[styles.linkText, { color: theme.primary }]}>
            Back to login
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
};

export default CheckEmail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    alignItems: "center",
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  title: {
    fontSize: 20,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 10,
    fontSize: 13,
    textAlign: "center",
  },
  errorText: {
    color: "red",
    marginTop: 12,
    textAlign: "center",
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
