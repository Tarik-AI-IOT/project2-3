import { useState } from "react";
import { StyleSheet, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import { fetchNutrition } from "../../services/nutrition";


const Nutrition = () => {
  const { theme } = useTheme();
  const [query, setQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);


  const handleSearch = async () => {
  if (!query.trim()) return;
  try {
    setLoading(true);
    setError("");
    const data = await fetchNutrition(query.trim());
        console.log("nutrition response:", data); // <-- add this

    setItems(data.foods || []);
  } catch (err) {
        console.log("nutrition error:", String(err)); // <-- add this

    setError("Could not load nutrition data.");
  } finally {
    setLoading(false);
  }
};

  return (
    <ThemedView style={styles.container} safe={true} safeBottom={false}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.title}>Nutrition</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Search for a food item
        </ThemedText>

        <View style={[styles.searchRow, { backgroundColor: theme.cardBackground }]}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="e.g. 2 eggs and toast"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text }]}
            returnKeyType="search"
          />
          <TouchableOpacity onPressOut={handleSearch} activeOpacity={0.8}>
            <Ionicons name="search" size={18} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator color={theme.primary} style={styles.state} />}
{!loading && error ? (
  <ThemedText style={[styles.state, { color: theme.error }]}>{error}</ThemedText>
) : null}

{!loading &&
  !error &&
  items.map((item, index) => {
    const nutrients = item.foodNutrients || [];
    const getNutrient = (name) =>
      nutrients.find((n) => n.nutrientName?.toLowerCase().includes(name))?.value;

    return (
      <View
        key={`${item.description}-${index}`}
        style={[styles.card, { backgroundColor: theme.cardBackground }]}
      >
        <ThemedText style={styles.cardTitle}>{item.description}</ThemedText>

        <View style={styles.macroRow}>
          <View style={styles.macroItem}>
            <ThemedText style={[styles.macroLabel, { color: theme.textSecondary }]}>
              Calories
            </ThemedText>
            <ThemedText style={styles.macroValue}>
              {getNutrient("energy") ?? "-"}
            </ThemedText>
          </View>
          <View style={styles.macroItem}>
            <ThemedText style={[styles.macroLabel, { color: theme.textSecondary }]}>
              Protein
            </ThemedText>
            <ThemedText style={styles.macroValue}>
              {getNutrient("protein") ?? "-"} g
            </ThemedText>
          </View>
        </View>

        <View style={styles.macroRow}>
          <View style={styles.macroItem}>
            <ThemedText style={[styles.macroLabel, { color: theme.textSecondary }]}>
              Carbs
            </ThemedText>
            <ThemedText style={styles.macroValue}>
              {getNutrient("carbohydrate") ?? "-"} g
            </ThemedText>
          </View>
          <View style={styles.macroItem}>
            <ThemedText style={[styles.macroLabel, { color: theme.textSecondary }]}>
              Fat
            </ThemedText>
            <ThemedText style={styles.macroValue}>
              {getNutrient("total lipid") ?? "-"} g
            </ThemedText>
          </View>
        </View>
      </View>
    );
  })}





      </ScrollView>
    </ThemedView>
  );
};

export default Nutrition;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  title: {
    marginTop: 18,
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
  },
  searchRow: {
    marginTop: 16,
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  input: {
    flex: 1,
    fontSize: 14,
    marginRight: 10,
  },
  state: {
  marginTop: 12,
},
card: {
  marginTop: 14,
  borderRadius: 18,
  padding: 16,
},
cardTitle: {
  fontSize: 16,
  fontWeight: "700",
  textTransform: "capitalize",
},
macroRow: {
  marginTop: 12,
  flexDirection: "row",
  justifyContent: "space-between",
},
macroItem: {
  flex: 1,
},
macroLabel: {
  fontSize: 12,
},
macroValue: {
  marginTop: 4,
  fontSize: 14,
  fontWeight: "600",
},

});
