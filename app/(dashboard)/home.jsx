import { StyleSheet, View, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native'
import { Link, useRouter } from 'expo-router'
import ThemedView from "../../components/ThemedView"
import { useTheme } from "../../context/ThemeContext";
import ThemedText from '../../components/ThemedText';
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, useEffect } from 'react';

const exercises = [
  { name: "Barbell Squat", reps: "4 × 8 reps", weight: "185 lbs", done: true },
  { name: "Romanian Deadlift", reps: "3 × 10 reps", weight: "135 lbs", done: true },
  { name: "Leg Press", reps: "3 × 12 reps", weight: "315 lbs", done: false },
  { name: "Leg Curl", reps: "3 × 12 reps", weight: "90 lbs", done: false },
];

const Home = () => {
    const { theme } = useTheme();
    const router = useRouter();

return (
    <ThemedView style={styles.container} safe={true}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Image  source={require("../../assets/rofit.png")} style={styles.logo} />
          <TouchableOpacity 
            style={[styles.profileButton, {backgroundColor: theme.cardBackground}]}
            activeOpacity={0.8}
            onPress={() => router.push("/(dashboard)/profile")}
          >
            <Ionicons name='person' size={18} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <ThemedText style={styles.title}>Welcome Back, Alex</ThemedText>
        <ThemedText style={[styles.subtitle, {color: theme.textSecondary}]}>Let's crush today's workout!</ThemedText>

        <View style={[styles.workoutCard, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.workoutHeader}>
            <View style={[styles.workoutIcon, { backgroundColor: theme.background }]}>
              <MaterialCommunityIcons name="calendar-month" size={18} color={theme.primary} />
            </View>
            <View style={styles.workoutInfo}>
              <ThemedText style={styles.workoutTitle}>Leg Day</ThemedText>
              <ThemedText style={[styles.workoutDate, { color: theme.textSecondary }]}>
                Wednesday, Jan 21
              </ThemedText>
            </View>
            <View style={[styles.workoutArrow, { backgroundColor: theme.background }]}>
              <Ionicons name="chevron-forward" size={16} color={theme.primary} />
            </View>
          </View>

          <View style={styles.progressRow}>
            <ThemedText style={[styles.progressLabel, { color: theme.textSecondary }]}>
              Workout of the Day
            </ThemedText>
          </View>
        </View>


      </ScrollView>
    </ThemedView>
  )
}

export default Home

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 32,
    },
    topBar: {
      marginTop: 6,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    logo: {
      width: 48,
      height: 48,
      borderRadius: 50,
    },
    profileButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      marginTop: 18,
        fontSize: 24,
        fontWeight: '700',
    },
    subtitle: {
      marginTop: 6,
      fontSize: 13,
    },
    workoutCard: {
      marginTop: 18,
      borderRadius: 20,
      padding: 16,
    }, 
    workoutHeader: {
      flexDirection: "row",
      alignItems: "center",
    },
    workoutIcon: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    workoutInfo: {
      flex: 1,
      marginLeft: 12,
    },
    workoutTitle: {
      fontSize: 16,
      fontWeight: "700",
    },
    workoutDate: {
      marginTop: 4,
      fontSize: 12,
    },
    workoutArrow: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    progressRow: {
      marginTop: 16,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    progressLabel: {
      fontSize: 12,
    },
})