import { StyleSheet, Pressable, KeyboardAvoidingView, Image, Platform } from "react-native";
import { Link, useRouter} from "expo-router";
import ThemedView from "../../components/ThemedView";
import ThemedButton from "../../components/ThemedButton";
import ThemedText from "../../components/ThemedText";
import Spacer from "../../components/Spacer";
import { Colors } from "../../contants/Colors";
import { TextInput } from "react-native";
import ThemedTextInput from "../../components/ThemedTextInput";
import { useState } from "react";
import { TouchableWithoutFeedback , Keyboard } from "react-native";
import { useUser } from "../../hooks/useUser";


const Login = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login, user } = useUser();

  const handleSubmit = async () => {
    try {
      await login(email, password);
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
        Login to your account
      </ThemedText>

      <ThemedTextInput style={{width: '80%', marginBottom: 16}} placeholder="Email" keyboardType="email-address"
        onChangeText={setEmail} value={email}
      />
      <ThemedTextInput style={{width: '80%', marginBottom: 24}} placeholder="Password" secureTextEntry={true}
        onChangeText={setPassword} value={password}
      />

      <ThemedButton onPress={handleSubmit}>
        <ThemedText>Login</ThemedText>
      </ThemedButton>

      <Spacer height={36} />

      <Link href="/register" style={styles.link}>
        <ThemedText
          style={{ textAlign: "center", textDecorationLine: "underline" }}
        >
          Register Instead
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

export default Login;

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
  btn: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 8,
  },
  pressed: {
    opacity: 0.8,
  },
});
