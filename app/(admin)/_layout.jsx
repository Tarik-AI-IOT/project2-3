import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../hooks/useUser";

const AdminLayout = () => {
  const { theme } = useTheme();
  const { user, role, loading } = useUser();

  if (loading) return null;
  if (!user) return <Redirect href="/login" />;
  if (role !== "trainer" && role !== "admin") return <Redirect href="/(dashboard)/home" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBarBackground,
          borderTopColor: theme.tabBarBorder,
        },
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
      }}
    >
      <Tabs.Screen
        name="overview"
        options={{
          title: "Overview",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "grid" : "grid-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: "Clients",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "people" : "people-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="assign"
        options={{
          title: "Assign",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "add-circle" : "add-circle-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "shield-checkmark" : "shield-checkmark-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="client/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
};

export default AdminLayout;
