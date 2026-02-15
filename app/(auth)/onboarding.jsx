import { StyleSheet, Keyboard, Image, Platform, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import ThemedButton from "../../components/ThemedButton";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import Spacer from "../../components/Spacer";
import ThemedTextInput from "../../components/ThemedTextInput";
import { useState } from "react";
import { TouchableWithoutFeedback } from "react-native";
import { useUser } from "../../hooks/useUser";
import { account } from "../../storage/data";
import { useTheme } from "../../context/ThemeContext";

const Onboarding = () => {
  const router = useRouter();
  const { user } = useUser();
  const { theme } = useTheme();

  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [goal, setGoal] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!age.trim() || !weight.trim() || !goal.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");

    try {
      // Save profile data for current user
      await account.saveProfile(user?.id, { age, weight, weightUnit, goal });
      router.replace("/(dashboard)/home");
    } catch (e) {
      setError("Could not save profile.");
    }
  };

  const content = (
    <ThemedView style={styles.container}>
      <Spacer />

      <Image source={require("../../assets/rofit.png")} style={styles.logo} />
      <Spacer height={24} />

      <ThemedText title style={styles.title}>
        Complete your profile
      </ThemedText>
      {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {content}
    </TouchableWithoutFeedback>
  );
};

export default Onboarding;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
