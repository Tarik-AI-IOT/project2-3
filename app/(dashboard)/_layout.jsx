import { Redirect, Tabs } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Animated } from "react-native";
import { useEffect, useRef } from "react";
import { useUser } from "../../hooks/useUser";


const DashboardLayout = () => {
  const { theme } = useTheme();
  const { user, role, loading } = useUser();

  if (loading) return null;
  if (!user) return <Redirect href="/login" />;
  if (role === "trainer" || role === "admin") return <Redirect href="/(admin)/clients" />;

  // Animation des icones de tab
    const AnimatedTabIcon = ({ name, focused, color }) => {
     const scale = useRef(new Animated.Value(focused ? 1.2 : 1)).current;

     useEffect(() => {
    Animated.spring(scale , {
      toValue: focused ? 1.2 : 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  }, [focused]);

     return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Ionicons name={name} size={24} color={color} />
    </Animated.View>
  );
}

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
        paddingTop: 10,
        height: 90,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon
              focused={focused}
              name={focused ? "home" : "home-outline"}
              color={focused ? theme.tabIconSelected : theme.tabIconDefault}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon
              focused={focused}
              name={focused ? "bar-chart" : "bar-chart-outline"}
                color={focused ? theme.tabIconSelected : theme.tabIconDefault}
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="nutrition"
        options={{
          title: "Nutrition",
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon
              focused={focused}
              name={focused ? "fast-food" : "fast-food-outline"}
              color={focused ? theme.tabIconSelected : theme.tabIconDefault}
            />
          ),
        }}
      />


      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
                <AnimatedTabIcon
                focused={focused}
                name={focused ? "person" : "person-outline"}
                color={focused ? theme.tabIconSelected : theme.tabIconDefault}
              />    
          ),
        }}
      />

      <Tabs.Screen
  name="exercise/[id]"
  options={{
    href: null,
  }}
/>
      <Tabs.Screen
  name="workout-session"
  options={{
    href: null,
  }}
/>
    </Tabs>
  );
};

export default DashboardLayout;
