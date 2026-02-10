const BASE_URL = "https://exercisedb.p.rapidapi.com";

const getHeaders = () => {
  const apiKey = process.env.EXPO_PUBLIC_RAPIDAPI_KEY;
  if (!apiKey) {
    throw new Error("Missing EXPO_PUBLIC_RAPIDAPI_KEY");
  }
  return {
    "X-RapidAPI-Key": apiKey,
    "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
  };
};

export const fetchExercises = async (limit = 5) => {
  const url = `${BASE_URL}/exercises?limit=${limit}&offset=0`;
  const response = await fetch(url, { headers: getHeaders() });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch exercises: ${response.status} ${text}`);
  }
  return response.json();
};



export const fetchExerciseById = async (id) => {
  const url = `${BASE_URL}/exercises/exercise/${id}`;
  const response = await fetch(url, { headers: getHeaders() });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch exercise details: ${response.status} ${text}`);
  }
  return response.json();
};
