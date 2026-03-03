const BASE_URL = "https://exercisedb.p.rapidapi.com";
const RAPIDAPI_HOST = "exercisedb.p.rapidapi.com";
const MATCH_LIMIT = 10;

const EXERCISE_ALIASES = {
  rdl: "romanian deadlift",
  "romanian deadlift": "romanian deadlift",
  squat: "barbell squat",
  "leg curl": "seated leg curl",
  "leg press": "sled leg press",
};

const matchCache = new Map();

const normalizeExerciseName = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getHeaders = () => {
  const apiKey = process.env.EXPO_PUBLIC_RAPIDAPI_KEY;
  if (!apiKey) {
    throw new Error("Missing EXPO_PUBLIC_RAPIDAPI_KEY");
  }

  return {
    "X-RapidAPI-Key": apiKey,
    "X-RapidAPI-Host": RAPIDAPI_HOST,
  };
};

const getCandidateScore = (targetName, candidateName) => {
  const target = normalizeExerciseName(targetName);
  const candidate = normalizeExerciseName(candidateName);

  if (!target || !candidate) return 0;
  if (target === candidate) return 100;
  if (candidate.startsWith(target) || target.startsWith(candidate)) return 92;
  if (candidate.includes(target) || target.includes(candidate)) return 84;

  const targetTokens = target.split(" ").filter(Boolean);
  const candidateTokens = candidate.split(" ").filter(Boolean);
  if (!targetTokens.length || !candidateTokens.length) return 0;

  const targetSet = new Set(targetTokens);
  const candidateSet = new Set(candidateTokens);
  const overlap = [...targetSet].filter((token) => candidateSet.has(token)).length;

  return Math.round((overlap / Math.max(targetSet.size, 1)) * 70);
};

const getSearchQueries = (friendlyName) => {
  const normalized = normalizeExerciseName(friendlyName);
  const alias = EXERCISE_ALIASES[normalized];

  return [...new Set([friendlyName, alias, normalized].filter(Boolean))];
};

const blobToDataUri = (blob) =>
  new Promise((resolve, reject) => {
    if (typeof FileReader === "undefined") {
      reject(new Error("FileReader not available"));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to convert blob to data URI"));
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });

export const fetchExercises = async (limit = 5) => {
  const url = `${BASE_URL}/exercises?limit=${limit}&offset=0`;
  const response = await fetch(url, { headers: getHeaders() });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch exercises: ${response.status} ${text}`);
  }
  return response.json();
};

export const searchExercisesByName = async (name, limit = MATCH_LIMIT) => {
  const query = String(name || "").trim();
  if (!query) return [];

  const encodedName = encodeURIComponent(query.toLowerCase());
  const url = `${BASE_URL}/exercises/name/${encodedName}?limit=${limit}&offset=0`;
  const response = await fetch(url, { headers: getHeaders() });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to search exercises: ${response.status} ${text}`);
  }

  const data = await response.json();
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

export const resolveExerciseMatch = async (friendlyName) => {
  const normalizedName = normalizeExerciseName(friendlyName);
  if (!normalizedName) return null;

  if (matchCache.has(normalizedName)) {
    return matchCache.get(normalizedName);
  }

  const queries = getSearchQueries(friendlyName);
  let bestMatch = null;
  let bestScore = -1;

  for (const query of queries) {
    const candidates = await searchExercisesByName(query);

    for (const candidate of candidates) {
      const score = getCandidateScore(normalizedName, candidate?.name || "");
      if (score > bestScore) {
        bestScore = score;
        bestMatch = candidate;
      }
    }

    if (bestScore >= 92) break;
  }

  const resolved = bestMatch || null;
  matchCache.set(normalizedName, resolved);
  return resolved;
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

export const getExerciseImageSource = async (exerciseId, resolution = 720) => {
  if (!exerciseId) return null;

  const url = `${BASE_URL}/image?exerciseId=${exerciseId}&resolution=${resolution}`;
  const headerSource = {
    uri: url,
    headers: getHeaders(),
  };

  try {
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to fetch exercise image: ${response.status} ${text}`);
    }

    if (typeof FileReader === "undefined") {
      return headerSource;
    }

    const blob = await response.blob();
    const dataUri = await blobToDataUri(blob);

    if (typeof dataUri === "string" && dataUri.startsWith("data:")) {
      return { uri: dataUri };
    }

    return headerSource;
  } catch {
    return headerSource;
  }
};
