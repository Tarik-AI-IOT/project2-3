import { StyleSheet, Keyboard, KeyboardAvoidingView, Image, Platform } from "react-native";
import { Link , useRouter } from "expo-router";
import ThemedButton from "../../components/ThemedButton";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import Spacer from "../../components/Spacer";
import ThemedTextInput from "../../components/ThemedTextInput";
import { useState } from "react";
import { TouchableWithoutFeedback } from "react-native";
import { useUser } from "../../hooks/useUser";


const Register = () => {

  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const {user, register} = useUser();

  const handleSubmit = async () => {
    try {
      await register(email, password);
      console.log("current user:", user);
      router.replace("/(dashboard)/home");
    }
    catch (error) {
      console.error("Registration error:", error.message);
    }
  };

  const content = (
    <ThemedView style={styles.container}>
      <Spacer />

      <Image source={require("../../assets/rofit.png")} style={styles.logo} />
      <Spacer height={24} />

      <ThemedText title style={styles.title}>
        Register for an account
      </ThemedText>
      
      <ThemedTextInput style={{width: '80%', marginBottom: 16}} placeholder="Email" keyboardType="email-address"
        onChangeText={setEmail} value={email}
      />
      <ThemedTextInput style={{width: '80%', marginBottom: 24}} placeholder="Password" secureTextEntry={true}
        onChangeText={setPassword} value={password}
      />

      <ThemedButton onPress={handleSubmit}>
        <ThemedText>Register</ThemedText>
      </ThemedButton>

      <Spacer height={36} />
      <Link href="/login" style={styles.link}>
        <ThemedText
          style={{ textAlign: "center", textDecorationLine: "underline" }}
        >
          Login Instead
        </ThemedText>
      </Link>
    </ThemedView>
  );

  return Platform.OS === "web" ? content : (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {content}
    </TouchableWithoutFeedback>
  );
};

export default Register;

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
});
