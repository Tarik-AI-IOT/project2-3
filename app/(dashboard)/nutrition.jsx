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
  const [hasSearched, setHasSearched] = useState(false);
  const [lastQuery, setLastQuery] = useState("");


  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      setHasSearched(false);
      setLastQuery("");
      setError("");
      setItems([]);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setHasSearched(true);
      setLastQuery(trimmed);

      const data = await fetchNutrition(trimmed);
      const foods = Array.isArray(data?.foods) ? data.foods : [];
      setItems(foods);
    } catch (err) {
      const message = String(err?.message || "");
      if (message.includes("Missing EXPO_PUBLIC_USDA_KEY")) {
        setError("Nutrition API key missing. Add EXPO_PUBLIC_USDA_KEY and restart Expo.");
      } else if (message.includes("429")) {
        setError("Nutrition API rate limit reached. Try again in a minute.");
      } else if (message.includes("401") || message.includes("403")) {
        setError("Nutrition API key is invalid or expired.");
      } else {
        setError("Could not load nutrition data.");
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const showEmptyState = !loading && !error && hasSearched && items.length === 0;

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
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity
            onPress={handleSearch}
            activeOpacity={0.8}
            style={[styles.searchButton, { backgroundColor: theme.background }]}
          >
            <Ionicons name="search" size={18} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator color={theme.primary} style={styles.state} />}
        {!loading && error ? <ThemedText style={[styles.state, { color: theme.error }]}>{error}</ThemedText> : null}

        {!loading && !error && hasSearched && items.length > 0 ? (
          <ThemedText style={[styles.resultMeta, { color: theme.textSecondary }]}>
            {items.length} result{items.length > 1 ? "s" : ""} for "{lastQuery}"
          </ThemedText>
        ) : null}

        {showEmptyState ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <ThemedText style={styles.emptyTitle}>No foods found</ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              Try a simpler search like "chicken breast" or "oatmeal".
            </ThemedText>
          </View>
        ) : null}

        {!loading &&
          !error &&
          items.map((item, index) => {
            const nutrients = item.foodNutrients || [];
            const getNutrient = (name) =>
              nutrients.find((n) => String(n.nutrientName || "").toLowerCase().includes(name))?.value;

            const calories = getNutrient("energy");
            const protein = getNutrient("protein");
            const carbs = getNutrient("carbohydrate");
            const fat = getNutrient("total lipid");

            return (
              <View
                key={`${item.description}-${index}`}
                style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
              >
                <ThemedText style={styles.cardTitle}>{item.description}</ThemedText>

                <View style={styles.macroRow}>
                  <View style={styles.macroItem}>
                    <ThemedText style={[styles.macroLabel, { color: theme.textSecondary }]}>Calories</ThemedText>
                    <ThemedText style={styles.macroValue}>{calories ?? "-"}</ThemedText>
                  </View>
                  <View style={styles.macroItem}>
                    <ThemedText style={[styles.macroLabel, { color: theme.textSecondary }]}>Protein</ThemedText>
                    <ThemedText style={styles.macroValue}>{protein ?? "-"} g</ThemedText>
                  </View>
                </View>

                <View style={styles.macroRow}>
                  <View style={styles.macroItem}>
                    <ThemedText style={[styles.macroLabel, { color: theme.textSecondary }]}>Carbs</ThemedText>
                    <ThemedText style={styles.macroValue}>{carbs ?? "-"} g</ThemedText>
                  </View>
                  <View style={styles.macroItem}>
                    <ThemedText style={[styles.macroLabel, { color: theme.textSecondary }]}>Fat</ThemedText>
                    <ThemedText style={styles.macroValue}>{fat ?? "-"} g</ThemedText>
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
  searchButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  state: {
    marginTop: 12,
  },
  resultMeta: {
    marginTop: 12,
    fontSize: 12,
  },
  emptyCard: {
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  emptyText: {
    marginTop: 6,
    fontSize: 12,
  },
  card: {
    marginTop: 14,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
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
