const BASE_URL = "https://api.nal.usda.gov/fdc/v1";

const getKey = () => {
  const apiKey = process.env.EXPO_PUBLIC_USDA_KEY;
  if (!apiKey) {
    throw new Error("Missing EXPO_PUBLIC_USDA_KEY");
  }
  return apiKey;
};

export const fetchNutrition = async (query) => {
  const url = `${BASE_URL}/foods/search?query=${encodeURIComponent(query)}&pageSize=5&api_key=${getKey()}`;
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch nutrition: ${response.status} ${text}`);
  }
  return response.json();
};
