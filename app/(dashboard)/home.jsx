import { StyleSheet, View, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import ThemedView from "../../components/ThemedView"
import { useTheme } from "../../context/ThemeContext";
import ThemedText from '../../components/ThemedText';
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, useEffect } from 'react';
import { fetchExercises } from '../../services/exercises';



const exercises = [
  { name: "Barbell Squat", reps: "4 x 8 reps", weight: "185 lbs", done: true },
  { name: "Romanian Deadlift", reps: "3 x 10 reps", weight: "135 lbs", done: true },
  { name: "Leg Press", reps: "3 x 12 reps", weight: "315 lbs", done: false },
  { name: "Leg Curl", reps: "3 x 12 reps", weight: "90 lbs", done: false },
];

const Home = () => {
    const { theme } = useTheme();
    const router = useRouter();

    const [workoutExercises, setWorkoutExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
      let active = true;
      const load = async () => {
        try {
          setLoading(true);
          const data = await fetchExercises(5);
          const list =
            Array.isArray(data) ? data :
            Array.isArray(data?.results) ? data.results :
            Array.isArray(data?.data) ? data.data :
            [];
        if (active) setWorkoutExercises(list);
          console.log("keys:", Object.keys(data || {}));

        } catch (err) {
          if (active) setError("Could not load exercises.");
        } finally {
          if (active) setLoading(false);
        }
      };
      load();
      return () => {
        active = false;
      };
    }, []);   


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
          {loading && <ActivityIndicator color={theme.primary} style={styles.state} />}
          {!loading && error ? (
            <ThemedText style={[styles.state, { color: theme.error }]}>{error}</ThemedText>
          ) : null}
          {!loading && !error && (
            <View style={styles.workoutList}>
              {workoutExercises.map((exercise) => {

                return (
                <TouchableOpacity
                  key={exercise.id}
                  style={styles.workoutItem}
                  activeOpacity={0.7}
                 onPress={() => router.push(`/exercise/${exercise.id}`)}

                >
                  <ThemedText style={styles.workoutItemText}>
                    {exercise.name}
                  </ThemedText>
                  <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
                </TouchableOpacity>);
})}


            </View>
          )}

        </View>
<ThemedText style={styles.sectionTitle}>Today's Exercises</ThemedText>

<View style={styles.exerciseList}>
  {exercises.map((exercise) => (
    <View
      key={exercise.name}
      style={[styles.exerciseCard, { backgroundColor: theme.cardBackground }]}
    >
      <View
        style={[
          styles.checkCircle,
          exercise.done
            ? { backgroundColor: theme.primary, borderColor: theme.primary }
            : { backgroundColor: "transparent", borderColor: theme.border },
        ]}
      >
        {exercise.done && (
          <Ionicons name="checkmark" size={14} color={theme.background} />
        )}
      </View>

      <View style={styles.exerciseInfo}>
        <ThemedText
          style={[
            styles.exerciseName,
            exercise.done && styles.exerciseDone,
            exercise.done && { color: theme.textSecondary },
          ]}
        >
          {exercise.name}
        </ThemedText>
        <View style={styles.exerciseMeta}>
          <ThemedText style={[styles.exerciseText, { color: theme.textSecondary }]}>
            {exercise.reps}
          </ThemedText>
          <ThemedText style={[styles.exerciseWeight, { color: theme.primary }]}>
            {exercise.weight}
          </ThemedText>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
    </View>
  ))}
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
    state: {
      marginTop: 10,
    },
    workoutList: {
      marginTop: 10,
    },
    workoutItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 8,
    },
    workoutItemText: {
      fontSize: 14,
      fontWeight: "600",
      textTransform: "capitalize",
    },
    sectionTitle: {
      marginTop: 24,
      marginBottom: 12,
      fontSize: 16,
      fontWeight: "700",
    },
    exerciseList: {
      gap: 12,
    },
    exerciseCard: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 18,
      padding: 14,
    },
    checkCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 1.5,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    exerciseInfo: {
      flex: 1,
    },
    exerciseName: {
      fontSize: 15,
      fontWeight: "600",
    },
    exerciseDone: {
      textDecorationLine: "line-through",
    },
    exerciseMeta: {
      marginTop: 4,
      flexDirection: "row",
      gap: 10,
    },
    exerciseText: {
      fontSize: 12,
    },
    exerciseWeight: {
      fontSize: 12,
      fontWeight: "600",
    },

})