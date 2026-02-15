import { StyleSheet, Keyboard, Image, Platform } from "react-native";
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

const Onboarding = () => {
  const router = useRouter();
  const { user } = useUser();

  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
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
      await account.saveProfile(user?.id, { age, weight, goal });
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
      <ThemedTextInput
        style={{ width: "80%", marginBottom: 16 }}
        placeholder="Weight (kg)"
        keyboardType="decimal-pad"
        onChangeText={setWeight}
        value={weight}
      />
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
});
