import AsyncStorage from "@react-native-async-storage/async-storage";
import { resolveExerciseMatch } from "./exercises";
import { supabase } from "../lib/supabase";

const STORAGE_PREFIX = "rofit:workout-plan";
const DEFAULT_ESTIMATED_MINUTES_PER_SET = 3;
const WORKOUT_SESSIONS_TABLE = "workout_sessions";

const BASE_PLAN_TEMPLATE = [
  { key: "barbell-squat", displayName: "Barbell Squat", sets: 4, reps: 8, load: "185 lbs" },
  { key: "romanian-deadlift", displayName: "Romanian Deadlift", sets: 3, reps: 10, load: "135 lbs" },
  { key: "leg-press", displayName: "Leg Press", sets: 3, reps: 12, load: "315 lbs" },
  { key: "leg-curl", displayName: "Leg Curl", sets: 3, reps: 12, load: "90 lbs" },
];

const sanitizeNumberInput = (value = "") => String(value).replace(/[^\d.]/g, "");

const getPlanStorageKey = (userId, dateKey) => `${STORAGE_PREFIX}:${userId || "guest"}:${dateKey}`;

export const getTodayDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parsePlannedWeight = (load = "") => {
  const match = String(load).match(/[\d.]+/);
  return match ? match[0] : "";
};

const createExerciseSetLogs = (sets, reps, load) =>
  Array.from({ length: sets }, (_, index) => ({
    setNumber: index + 1,
    plannedReps: reps,
    plannedWeight: load,
    actualReps: String(reps),
    actualWeight: parsePlannedWeight(load),
    completed: false,
  }));

const createPlanFromTemplate = (dateKey) => ({
  id: `plan-${dateKey}`,
  dateKey,
  label: "Today Plan",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  finishedAt: null,
  workoutNote: "",
  exercises: BASE_PLAN_TEMPLATE.map((exercise) => ({
    key: exercise.key,
    displayName: exercise.displayName,
    plannedSets: exercise.sets,
    plannedReps: exercise.reps,
    plannedLoad: exercise.load,
    apiId: null,
    target: "",
    equipment: "",
    apiLookupTried: false,
    note: "",
    setLogs: createExerciseSetLogs(exercise.sets, exercise.reps, exercise.load),
  })),
});

const clonePlan = (plan) => ({
  ...plan,
  exercises: plan.exercises.map((exercise) => ({
    ...exercise,
    setLogs: exercise.setLogs.map((setLog) => ({ ...setLog })),
  })),
});

const normalizeLoadedPlan = (plan, dateKey) => {
  if (!plan || typeof plan !== "object") return createPlanFromTemplate(dateKey);
  if (!Array.isArray(plan.exercises)) return createPlanFromTemplate(dateKey);

  return {
    ...plan,
    dateKey: plan.dateKey || dateKey,
    workoutNote: plan.workoutNote || "",
    exercises: plan.exercises.map((exercise, exerciseIndex) => {
      const fallbackTemplate = BASE_PLAN_TEMPLATE[exerciseIndex] || BASE_PLAN_TEMPLATE[0];
      const plannedSets = Number(exercise.plannedSets || fallbackTemplate.sets || 3);
      const plannedReps = Number(exercise.plannedReps || fallbackTemplate.reps || 10);
      const plannedLoad = exercise.plannedLoad || fallbackTemplate.load || "";
      const rawSetLogs = Array.isArray(exercise.setLogs)
        ? exercise.setLogs
        : createExerciseSetLogs(plannedSets, plannedReps, plannedLoad);

      const setLogs = rawSetLogs.map((setLog, setIndex) => ({
        setNumber: setLog.setNumber || setIndex + 1,
        plannedReps: setLog.plannedReps || plannedReps,
        plannedWeight: setLog.plannedWeight || plannedLoad,
        actualReps: typeof setLog.actualReps === "string" ? setLog.actualReps : String(setLog.actualReps || ""),
        actualWeight:
          typeof setLog.actualWeight === "string" ? setLog.actualWeight : String(setLog.actualWeight || ""),
        completed: Boolean(setLog.completed),
      }));

      return {
        ...exercise,
        key: exercise.key || fallbackTemplate.key || `exercise-${exerciseIndex + 1}`,
        displayName: exercise.displayName || fallbackTemplate.displayName || "Exercise",
        plannedSets,
        plannedReps,
        plannedLoad,
        apiId: exercise.apiId || null,
        target: exercise.target || "",
        equipment: exercise.equipment || "",
        apiLookupTried: Boolean(exercise.apiLookupTried),
        note: exercise.note || "",
        setLogs,
      };
    }),
  };
};

const getPlanUpdatedAtMs = (plan) => {
  const parsed = Date.parse(plan?.updatedAt || "");
  return Number.isFinite(parsed) ? parsed : 0;
};

const chooseNewestPlan = (...plans) => {
  const valid = plans.filter(Boolean);
  if (!valid.length) return null;

  return valid.reduce((latest, current) =>
    getPlanUpdatedAtMs(current) > getPlanUpdatedAtMs(latest) ? current : latest
  );
};

const buildSupabaseRow = (userId, plan) => {
  const stats = getWorkoutStats(plan);
  return {
    user_id: userId,
    date_key: plan.dateKey,
    session_data: plan,
    total_exercises: stats.totalExercises,
    completed_exercises: stats.completedExercises,
    total_sets: stats.totalSets,
    completed_sets: stats.completedSets,
    completion_rate: stats.completionRate,
    finished_at: plan.finishedAt || null,
    updated_at: plan.updatedAt || new Date().toISOString(),
  };
};

const mapSupabaseRowToPlan = (row) => {
  if (!row?.session_data) return null;
  const normalized = normalizeLoadedPlan(row.session_data, row.date_key || row.session_data?.dateKey);
  return {
    ...normalized,
    updatedAt: normalized.updatedAt || row.updated_at || new Date().toISOString(),
    finishedAt: normalized.finishedAt || row.finished_at || null,
  };
};

const isMissingTableError = (error) => {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("does not exist") || message.includes("relation") || message.includes("undefined table");
};

const fetchRemoteWorkoutPlan = async (userId, dateKey) => {
  if (!userId) return null;

  const { data, error } = await supabase
    .from(WORKOUT_SESSIONS_TABLE)
    .select("date_key, session_data, updated_at, finished_at")
    .eq("user_id", userId)
    .eq("date_key", dateKey)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) return null;
    throw error;
  }

  return mapSupabaseRowToPlan(data);
};

const fetchRemoteWorkoutHistory = async (userId, limit = 12) => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from(WORKOUT_SESSIONS_TABLE)
    .select("date_key, session_data, updated_at, finished_at")
    .eq("user_id", userId)
    .order("date_key", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }

  return (data || [])
    .map((row) => mapSupabaseRowToPlan(row))
    .filter(Boolean)
    .sort((a, b) => String(a.dateKey).localeCompare(String(b.dateKey)));
};

const upsertRemoteWorkoutPlan = async (userId, plan) => {
  if (!userId || !plan?.dateKey) return;

  const row = buildSupabaseRow(userId, plan);
  const { error } = await supabase
    .from(WORKOUT_SESSIONS_TABLE)
    .upsert(row, { onConflict: "user_id,date_key" });

  if (error && !isMissingTableError(error)) {
    throw error;
  }
};

const ensureExerciseMatches = async (plan) => {
  const nextPlan = clonePlan(plan);

  await Promise.all(
    nextPlan.exercises.map(async (exercise) => {
      if (exercise.apiLookupTried) return;

      try {
        const match = await resolveExerciseMatch(exercise.displayName);
        exercise.apiId = match?.id ?? null;
        exercise.target = match?.target ?? "";
        exercise.equipment = match?.equipment ?? "";
      } catch {
        exercise.apiId = exercise.apiId ?? null;
        exercise.target = exercise.target ?? "";
        exercise.equipment = exercise.equipment ?? "";
      } finally {
        exercise.apiLookupTried = true;
      }
    })
  );

  nextPlan.updatedAt = new Date().toISOString();
  return nextPlan;
};

export const loadWorkoutPlan = async (userId, dateKey = getTodayDateKey()) => {
  const key = getPlanStorageKey(userId, dateKey);
  const raw = await AsyncStorage.getItem(key);

  let parsed = null;
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
  }

  let remotePlan = null;
  try {
    remotePlan = await fetchRemoteWorkoutPlan(userId, dateKey);
  } catch {
    remotePlan = null;
  }

  const normalizedLocal = parsed ? normalizeLoadedPlan(parsed, dateKey) : null;
  const merged = chooseNewestPlan(normalizedLocal, remotePlan) || createPlanFromTemplate(dateKey);
  const hydrated = await ensureExerciseMatches(merged);
  await AsyncStorage.setItem(key, JSON.stringify(hydrated));

  try {
    await upsertRemoteWorkoutPlan(userId, hydrated);
  } catch {
    // Keep local-first behavior if remote sync fails.
  }

  return hydrated;
};

export const saveWorkoutPlan = async (userId, plan) => {
  if (!plan?.dateKey) return;
  const key = getPlanStorageKey(userId, plan.dateKey);
  const payload = {
    ...plan,
    updatedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(key, JSON.stringify(payload));

  try {
    await upsertRemoteWorkoutPlan(userId, payload);
  } catch {
    // Avoid breaking workout flow when remote sync fails.
  }
};

const updateExercise = (plan, exerciseKey, updater) => ({
  ...plan,
  exercises: plan.exercises.map((exercise) => {
    if (exercise.key !== exerciseKey) return exercise;
    return updater(exercise);
  }),
  updatedAt: new Date().toISOString(),
});

export const updateSetField = (plan, exerciseKey, setNumber, field, value) =>
  updateExercise(plan, exerciseKey, (exercise) => ({
    ...exercise,
    setLogs: exercise.setLogs.map((setLog) => {
      if (setLog.setNumber !== setNumber) return setLog;
      return {
        ...setLog,
        [field]: field === "actualReps" || field === "actualWeight" ? sanitizeNumberInput(value) : value,
      };
    }),
  }));

export const toggleSetCompletion = (plan, exerciseKey, setNumber) =>
  updateExercise(plan, exerciseKey, (exercise) => ({
    ...exercise,
    setLogs: exercise.setLogs.map((setLog) => {
      if (setLog.setNumber !== setNumber) return setLog;
      return { ...setLog, completed: !setLog.completed };
    }),
  }));

export const toggleExerciseCompletion = (plan, exerciseKey) =>
  updateExercise(plan, exerciseKey, (exercise) => {
    const allCompleted = exercise.setLogs.every((setLog) => setLog.completed);
    const markAsCompleted = !allCompleted;

    return {
      ...exercise,
      setLogs: exercise.setLogs.map((setLog) => ({
        ...setLog,
        completed: markAsCompleted,
        actualReps: markAsCompleted ? setLog.actualReps || String(setLog.plannedReps || "") : setLog.actualReps,
        actualWeight: markAsCompleted
          ? setLog.actualWeight || parsePlannedWeight(setLog.plannedWeight || "")
          : setLog.actualWeight,
      })),
    };
  });

export const updateExerciseNote = (plan, exerciseKey, note) =>
  updateExercise(plan, exerciseKey, (exercise) => ({
    ...exercise,
    note,
  }));

export const updateWorkoutNote = (plan, note) => ({
  ...plan,
  workoutNote: note,
  updatedAt: new Date().toISOString(),
});

export const markWorkoutFinished = (plan) => ({
  ...plan,
  finishedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const getWorkoutStats = (plan) => {
  if (!plan?.exercises?.length) {
    return {
      totalExercises: 0,
      completedExercises: 0,
      totalSets: 0,
      completedSets: 0,
      completionRate: 0,
      estimatedMinutes: 0,
    };
  }

  const totalExercises = plan.exercises.length;
  const totalSets = plan.exercises.reduce((sum, exercise) => sum + exercise.setLogs.length, 0);
  const completedSets = plan.exercises.reduce(
    (sum, exercise) => sum + exercise.setLogs.filter((setLog) => setLog.completed).length,
    0
  );
  const completedExercises = plan.exercises.filter((exercise) =>
    exercise.setLogs.every((setLog) => setLog.completed)
  ).length;

  return {
    totalExercises,
    completedExercises,
    totalSets,
    completedSets,
    completionRate: totalSets ? completedSets / totalSets : 0,
    estimatedMinutes: totalSets * DEFAULT_ESTIMATED_MINUTES_PER_SET,
  };
};

const parseDateKeyFromStorageKey = (storageKey) => {
  const parts = String(storageKey || "").split(":");
  return parts[parts.length - 1] || "";
};

const hasAnySetActivity = (plan) => {
  const hasCompletedSet = plan?.exercises?.some((exercise) =>
    exercise?.setLogs?.some((setLog) => setLog.completed)
  );

  return Boolean(hasCompletedSet || plan?.finishedAt);
};

export const loadWorkoutHistory = async (userId, limit = 8) => {
  const prefix = `${STORAGE_PREFIX}:${userId || "guest"}:`;
  const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(prefix));
  const pairs = keys.length ? await AsyncStorage.multiGet(keys) : [];
  const plans = [];

  for (const [storageKey, rawValue] of pairs) {
    if (!rawValue) continue;

    let parsed = null;
    try {
      parsed = JSON.parse(rawValue);
    } catch {
      parsed = null;
    }

    const dateKey = parseDateKeyFromStorageKey(storageKey);
    const normalized = normalizeLoadedPlan(parsed, dateKey);
    if (!hasAnySetActivity(normalized)) continue;
    plans.push(normalized);
  }

  plans.sort((a, b) => String(a.dateKey).localeCompare(String(b.dateKey)));

  if (userId && plans.length) {
    await Promise.all(
      plans.map(async (plan) => {
        try {
          await upsertRemoteWorkoutPlan(userId, plan);
        } catch {
          // Keep history loading resilient even if remote sync fails.
        }
      })
    );
  }

  let remotePlans = [];
  try {
    remotePlans = await fetchRemoteWorkoutHistory(userId, Math.max(limit * 2, 12));
  } catch {
    remotePlans = [];
  }

  const mergedByDate = new Map();
  [...plans, ...remotePlans].forEach((plan) => {
    if (!plan?.dateKey) return;
    const existing = mergedByDate.get(plan.dateKey);
    if (!existing || getPlanUpdatedAtMs(plan) >= getPlanUpdatedAtMs(existing)) {
      mergedByDate.set(plan.dateKey, plan);
    }
  });

  const merged = [...mergedByDate.values()]
    .filter((plan) => hasAnySetActivity(plan))
    .sort((a, b) => String(a.dateKey).localeCompare(String(b.dateKey)));

  await Promise.all(
    merged.map(async (plan) => {
      const localKey = getPlanStorageKey(userId, plan.dateKey);
      const localRaw = await AsyncStorage.getItem(localKey);

      let localPlan = null;
      if (localRaw) {
        try {
          localPlan = normalizeLoadedPlan(JSON.parse(localRaw), plan.dateKey);
        } catch {
          localPlan = null;
        }
      }

      if (!localPlan || getPlanUpdatedAtMs(plan) > getPlanUpdatedAtMs(localPlan)) {
        await AsyncStorage.setItem(localKey, JSON.stringify(plan));
      }
    })
  );

  if (!limit || merged.length <= limit) return merged;
  return merged.slice(-limit);
};
