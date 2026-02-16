import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { UserProvider } from "../context/UserContext";
import { useUser } from "../hooks/useUser";
import LoadingScreen from "../components/LoadingScreen";

const LayoutContent = () => {
  const { theme, mode } = useTheme();

  return (
    <UserProvider>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <AppStack theme={theme} />
    </UserProvider>
  );
};

const AppStack = ({ theme }) => {
  const { loading } = useUser();
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (loading || !minTimePassed) {
    return <LoadingScreen label="No excuses. Just results." />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ title: "Home" }} />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LayoutContent />
    </ThemeProvider>
  );
}
