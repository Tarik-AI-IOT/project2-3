import { StyleSheet, Text, Image } from "react-native";
import { Link } from "expo-router";
import ThemedView from "../components/ThemedView";
import { useTheme } from "../context/ThemeContext";
import Logo from "../assets/flowerLight.jpg";
import ThemedLogo from "../components/ThemedLogo";
import Spacer from "../components/Spacer";
import ThemedText from "../components/ThemedText";

const Home = () => {
  const { theme } = useTheme();

  return (
    <ThemedView style={styles.container}>
      <ThemedLogo style={styles.img} />
      <Spacer height={20} />
      <ThemedText title={true}>The number 1</ThemedText>

      <Link href="/login" style={styles.link}>
        <ThemedText>Login Page</ThemedText>
      </Link>
      <Link href="/register" style={styles.link}>
        <ThemedText>Register Page</ThemedText>
      </Link>
      <Link href="/profile" style={styles.link}>
        <ThemedText>Profile Page</ThemedText>
      </Link>
    </ThemedView>
  );
};

export default Home;

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
  img: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 20,
  },
  link: {
    marginVertical: 10,
    borderBottomWidth: 1,
  },
});





// import { Redirect } from "expo-router";
// import { useAuth } from "../context/AuthContext";

// export default function Index() {
//   const { user, loading } = useAuth();

//   if (loading) return null;

//   if (user) {
//     return <Redirect href="/home" />;
//   }

//   return <Redirect href="/login" />;
// }
