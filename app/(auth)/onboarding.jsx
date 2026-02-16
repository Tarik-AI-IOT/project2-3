import { StyleSheet, Keyboard, Image, Platform, View, TouchableOpacity, KeyboardAvoidingView } from "react-native";
import { useRouter } from "expo-router";
import ThemedButton from "../../components/ThemedButton";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import Spacer from "../../components/Spacer";
import ThemedTextInput from "../../components/ThemedTextInput";
import { useState } from "react";
import { TouchableWithoutFeedback } from "react-native";
import { useUser } from "../../hooks/useUser";
import { useTheme } from "../../context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import LoadingScreen from "../../components/LoadingScreen";

const Onboarding = () => {
  const router = useRouter();
  const { pendingSignup, register, clearPendingSignup } = useUser();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [goal, setGoal] = useState("");
  const [error, setError] = useState("");
  const [emailExists, setEmailExists] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return;
    if (!age.trim() || !weight.trim() || !goal.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setEmailExists(false);
    setSubmitting(true);

    try {
      const startTime = Date.now();
      if (!pendingSignup) {
        setError("Please register first.");
        setSubmitting(false);
        return;
      }

      await register({
        ...pendingSignup,
        age,
        weight,
        weightUnit,
        goal,
      });

      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 3000 - elapsed);
      if (remaining) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }

      clearPendingSignup();
      router.replace("/check-email");
    } catch (e) {
      const message = e?.message || "Could not sign up.";
      setError(message);
      const lower = message.toLowerCase();
      setEmailExists(
        lower.includes("already") || lower.includes("exist") || lower.includes("registered")
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitting) {
    return <LoadingScreen label="Creating account" />;
  }

  const content = (
    <ThemedView style={styles.container}>
      <View style={[styles.topRow, { top: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => {
            clearPendingSignup();
            router.replace("/login");
          }}
          style={[
            styles.backPill,
            { backgroundColor: theme.cardBackground, borderColor: theme.border },
          ]}
          activeOpacity={0.85}
        >
          <View style={[styles.backIcon, { backgroundColor: theme.background }]}>
            <Ionicons name="chevron-back" size={16} color={theme.primary} />
          </View>
          <ThemedText style={[styles.backText, { color: theme.text }]}>
            Back to login
          </ThemedText>
        </TouchableOpacity>
      </View>
      <Spacer />

      <Image source={require("../../assets/rofit.png")} style={styles.logo} />
      <Spacer height={24} />

      <ThemedText title style={styles.title}>
        Complete your profile
      </ThemedText>
      {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
      {emailExists ? (
        <TouchableOpacity onPress={() => router.replace("/login")}>
          <ThemedText style={[styles.linkText, { color: theme.primary }]}>
            Go to login
          </ThemedText>
        </TouchableOpacity>
      ) : null}

      <ThemedTextInput
        style={{ width: "80%", marginBottom: 16 }}
        placeholder="Age"
        keyboardType="number-pad"
        onChangeText={setAge}
        value={age}
      />
      <View style={styles.weightRow}>
        <ThemedTextInput
          style={styles.weightInput}
          placeholder={`Weight (${weightUnit})`}
          keyboardType="decimal-pad"
          onChangeText={setWeight}
          value={weight}
        />
        <View style={styles.unitToggle}>
          {["kg", "lbs"].map((unit) => (
            <TouchableOpacity
              key={unit}
              onPress={() => setWeightUnit(unit)}
              style={[
                styles.toggleBtn,
                { borderColor: theme.border },
                weightUnit === unit && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
            >
              <ThemedText
                style={[
                  styles.toggleText,
                  { color: theme.textSecondary },
                  weightUnit === unit && { color: "#ffffff", fontWeight: "600" },
                ]}
              >
                {unit.toUpperCase()}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ThemedTextInput
        style={{ width: "80%", marginBottom: 24 }}
        placeholder="Goal (e.g. Lose weight)"
        onChangeText={setGoal}
        value={goal}
      />

      <ThemedButton onPress={handleSubmit}>
        <ThemedText>Continue</ThemedText>
      </ThemedButton>
    </ThemedView>
  );

  return Platform.OS === "web" ? content : (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        {content}
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default Onboarding;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  topRow: {
    position: "absolute",
    top: 0,
    left: 20,
  },
  title: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 24,
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  errorText: {
    color: "red",
    marginBottom: 12,
    textAlign: "center",
  },
  backPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
  },
  backIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    fontSize: 13,
    fontWeight: "600",
  },
  weightRow: {
    width: "80%",
    marginBottom: 16,
  },
  weightInput: {
    width: "100%",
    marginBottom: 10,
  },
  unitToggle: {
    flexDirection: "row",
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  toggleText: {
    fontSize: 12,
  },
  
});
