import { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, View } from "react-native";
import ThemedView from "./ThemedView";
import ThemedText from "./ThemedText";
import { useTheme } from "../context/ThemeContext";

const LoadingScreen = ({ label = "Welcome" }) => {
  const { theme } = useTheme();
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <ThemedView style={styles.container} safe={true}>
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.ring,
            { borderColor: theme.primary, transform: [{ rotate }] },
          ]}
        />
        <Image source={require("../assets/rofit.png")} style={styles.logo} />
      </View>
      <ThemedText style={styles.label}>{label}</ThemedText>
    </ThemedView>
  );
};

export default LoadingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  ring: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderStyle: "dashed",
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
});
