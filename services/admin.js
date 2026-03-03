import { supabase } from "../lib/supabase";

const PROFILES_TABLE = "profiles";
const WORKOUT_SESSIONS_TABLE = "workout_sessions";

const toDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateKey = (dateKey) => {
  const [year, month, day] = String(dateKey || "").split("-").map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
};

const getWeekStart = (dateInput = new Date()) => {
  const date = new Date(dateInput);
  date.setHours(0, 0, 0, 0);
  const dayOffset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - dayOffset);
  return date;
};

const parseWeight = (value = "") => {
  const numeric = parseFloat(String(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
};

const parsePlannedWeight = (value = "") => {
  const match = String(value).match(/[\d.]+/);
  return match ? match[0] : "";
};

const sanitizeName = (value = "") => String(value).trim().replace(/\s+/g, " ");
const sanitizeNote = (value = "") => String(value || "").trim();

const sanitizeInt = (value, fallback, min, max) => {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
};

const createSetLogs = (sets, reps, load) =>
  Array.from({ length: sets }, (_, index) => ({
    setNumber: index + 1,
    plannedReps: reps,
    plannedWeight: load,
    actualReps: String(reps),
    actualWeight: parsePlannedWeight(load),
    completed: false,
  }));

const createBlankPlan = (dateKey) => {
  const now = new Date().toISOString();
  return {
    id: `plan-${dateKey}`,
    dateKey,
    label: "Trainer Plan",
    createdAt: now,
    updatedAt: now,
    finishedAt: null,
    workoutNote: "",
    exercises: [],
  };
};

const normalizePlan = (plan, dateKey) => {
  if (!plan || typeof plan !== "object") return createBlankPlan(dateKey);
  const now = new Date().toISOString();
  const exercises = Array.isArray(plan.exercises) ? plan.exercises : [];

  return {
    ...plan,
    dateKey: plan.dateKey || dateKey,
    id: plan.id || `plan-${dateKey}`,
    label: plan.label || "Trainer Plan",
    createdAt: plan.createdAt || now,
    updatedAt: plan.updatedAt || now,
    workoutNote: plan.workoutNote || "",
    exercises: exercises.map((exercise, exerciseIndex) => {
      const plannedSets = sanitizeInt(exercise.plannedSets, 3, 1, 12);
      const plannedReps = sanitizeInt(exercise.plannedReps, 10, 1, 50);
      const plannedLoad = sanitizeName(exercise.plannedLoad || "Bodyweight");
      const setLogs = Array.isArray(exercise.setLogs) && exercise.setLogs.length
        ? exercise.setLogs.map((setLog, setIndex) => ({
            setNumber: setLog.setNumber || setIndex + 1,
            plannedReps: sanitizeInt(setLog.plannedReps, plannedReps, 1, 50),
            plannedWeight: sanitizeName(setLog.plannedWeight || plannedLoad),
            actualReps: typeof setLog.actualReps === "string" ? setLog.actualReps : String(setLog.actualReps || ""),
            actualWeight:
              typeof setLog.actualWeight === "string" ? setLog.actualWeight : String(setLog.actualWeight || ""),
            completed: Boolean(setLog.completed),
          }))
        : createSetLogs(plannedSets, plannedReps, plannedLoad);

      return {
        ...exercise,
        key: exercise.key || `exercise-${exerciseIndex + 1}`,
        displayName: sanitizeName(exercise.displayName || "Exercise"),
        plannedSets,
        plannedReps,
        plannedLoad,
        apiId: exercise.apiId || null,
        target: exercise.target || "",
        equipment: exercise.equipment || "",
        apiLookupTried: Boolean(exercise.apiLookupTried),
        note: sanitizeNote(exercise.note || ""),
        setLogs,
      };
    }),
  };
};

const getPlanStats = (plan) => {
  const exercises = Array.isArray(plan?.exercises) ? plan.exercises : [];
  const totalExercises = exercises.length;
  const totalSets = exercises.reduce((sum, exercise) => sum + (exercise.setLogs?.length || 0), 0);
  const completedSets = exercises.reduce(
    (sum, exercise) => sum + (exercise.setLogs || []).filter((setLog) => setLog.completed).length,
    0
  );
  const completedExercises = exercises.filter((exercise) =>
    (exercise.setLogs || []).length > 0 && (exercise.setLogs || []).every((setLog) => setLog.completed)
  ).length;

  return {
    totalExercises,
    completedExercises,
    totalSets,
    completedSets,
    completionRate: totalSets ? completedSets / totalSets : 0,
  };
};

const getSessionTopWeight = (sessionData) => {
  const exercises = Array.isArray(sessionData?.exercises) ? sessionData.exercises : [];
  const weights = exercises
    .flatMap((exercise) => exercise?.setLogs || [])
    .map((setLog) => parseWeight(setLog.actualWeight))
    .filter((value) => typeof value === "number");
  return weights.length ? Math.max(...weights) : 0;
};

const buildExerciseKey = (name) =>
  `${String(name || "exercise")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}-${Date.now()}`;

const buildExerciseFromInput = ({ name, sets, reps, load, note }) => {
  const displayName = sanitizeName(name);
  const plannedSets = sanitizeInt(sets, 3, 1, 12);
  const plannedReps = sanitizeInt(reps, 10, 1, 50);
  const plannedLoad = sanitizeName(load || "Bodyweight");

  if (!displayName) throw new Error("Exercise name is required.");

  return {
    key: buildExerciseKey(displayName),
    displayName,
    plannedSets,
    plannedReps,
    plannedLoad,
    apiId: null,
    target: "",
    equipment: "",
    apiLookupTried: false,
    note: sanitizeNote(note),
    setLogs: createSetLogs(plannedSets, plannedReps, plannedLoad),
  };
};

const getClientName = (client) => `${client?.first_name || ""} ${client?.last_name || ""}`.trim() || "Client";

const toDateLabel = (dateKey) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(parseDateKey(dateKey));

const fetchLatestSessionsByClient = async (clientIds) => {
  if (!Array.isArray(clientIds) || !clientIds.length) return new Map();
  const { data, error } = await supabase
    .from(WORKOUT_SESSIONS_TABLE)
    .select("user_id, date_key, completion_rate, completed_sets, total_sets, updated_at, session_data")
    .in("user_id", clientIds)
    .order("date_key", { ascending: false });

  if (error) throw error;

  const byClient = new Map();
  (data || []).forEach((row) => {
    if (!byClient.has(row.user_id)) {
      byClient.set(row.user_id, row);
    }
  });

  return byClient;
};

export const getTodayDateKey = () => toDateKey(new Date());

export const loadManagedClients = async (managerId, role = "trainer") => {
  if (!managerId) return [];
  let query = supabase
    .from(PROFILES_TABLE)
    .select("id, first_name, last_name, goal, weight, weight_unit, role, trainer_id, updated_at")
    .eq("role", "client");

  if (role === "trainer") {
    query = query.eq("trainer_id", managerId);
  }

  const { data, error } = await query.order("first_name", { ascending: true });
  if (error) throw error;

  const clients = data || [];
  const latestByClient = await fetchLatestSessionsByClient(clients.map((client) => client.id));

  return clients.map((client) => {
    const latestSession = latestByClient.get(client.id) || null;
    return {
      ...client,
      fullName: getClientName(client),
      latestSession: latestSession
        ? {
            dateKey: latestSession.date_key,
            dateLabel: toDateLabel(latestSession.date_key),
            completionRate: latestSession.completion_rate || 0,
            completedSets: latestSession.completed_sets || 0,
            totalSets: latestSession.total_sets || 0,
            topWeight: getSessionTopWeight(latestSession.session_data),
          }
        : null,
    };
  });
};

export const loadClientById = async (clientId) => {
  if (!clientId) return null;
  const { data, error } = await supabase
    .from(PROFILES_TABLE)
    .select("id, first_name, last_name, goal, weight, weight_unit, role, trainer_id")
    .eq("id", clientId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    fullName: getClientName(data),
  };
};

export const loadClientWorkoutHistory = async (clientId, limit = 18) => {
  if (!clientId) return [];
  const { data, error } = await supabase
    .from(WORKOUT_SESSIONS_TABLE)
    .select("user_id, date_key, completion_rate, completed_sets, total_sets, finished_at, session_data")
    .eq("user_id", clientId)
    .order("date_key", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || [])
    .map((row) => ({
      dateKey: row.date_key,
      dateLabel: toDateLabel(row.date_key),
      completionRate: row.completion_rate || 0,
      completedSets: row.completed_sets || 0,
      totalSets: row.total_sets || 0,
      finishedAt: row.finished_at || null,
      topWeight: getSessionTopWeight(row.session_data),
      sessionData: row.session_data || null,
    }))
    .sort((a, b) => String(a.dateKey).localeCompare(String(b.dateKey)));
};

export const buildClientSummaryFromHistory = (history) => {
  const sessions = Array.isArray(history) ? history : [];
  const totalSessions = sessions.length;
  const avgCompletion = totalSessions
    ? Math.round((sessions.reduce((sum, session) => sum + session.completionRate, 0) / totalSessions) * 100)
    : 0;
  const bestLoad = sessions.length ? Math.max(...sessions.map((session) => session.topWeight || 0)) : 0;
  const latest = sessions.length ? sessions[sessions.length - 1] : null;

  return {
    totalSessions,
    avgCompletion,
    bestLoad,
    latestDate: latest?.dateLabel || "-",
    latestMax: latest?.topWeight || 0,
  };
};

export const loadAdminOverview = async (managerId, role = "trainer") => {
  const clients = await loadManagedClients(managerId, role);
  const clientIds = clients.map((client) => client.id);

  if (!clientIds.length) {
    return {
      totalClients: 0,
      activeClients: 0,
      sessionsThisWeek: 0,
      avgCompletionThisWeek: 0,
      topClients: [],
    };
  }

  const { data, error } = await supabase
    .from(WORKOUT_SESSIONS_TABLE)
    .select("user_id, date_key, completion_rate, session_data")
    .in("user_id", clientIds)
    .order("date_key", { ascending: false })
    .limit(280);

  if (error) throw error;

  const now = new Date();
  const weekStart = getWeekStart(now);
  const activeSince = new Date(now);
  activeSince.setDate(activeSince.getDate() - 14);

  const sessions = data || [];
  const thisWeekSessions = sessions.filter((row) => parseDateKey(row.date_key) >= weekStart);
  const sessionsThisWeek = thisWeekSessions.length;
  const avgCompletionThisWeek = sessionsThisWeek
    ? Math.round((thisWeekSessions.reduce((sum, row) => sum + (row.completion_rate || 0), 0) / sessionsThisWeek) * 100)
    : 0;

  const activeClientIds = new Set(
    sessions.filter((row) => parseDateKey(row.date_key) >= activeSince).map((row) => row.user_id)
  );

  const topClientMap = new Map();
  sessions.forEach((row) => {
    const entry = topClientMap.get(row.user_id) || { sessions: 0, bestLoad: 0 };
    entry.sessions += 1;
    entry.bestLoad = Math.max(entry.bestLoad, getSessionTopWeight(row.session_data));
    topClientMap.set(row.user_id, entry);
  });

  const topClients = clients
    .map((client) => ({
      id: client.id,
      fullName: client.fullName,
      sessions: topClientMap.get(client.id)?.sessions || 0,
      bestLoad: topClientMap.get(client.id)?.bestLoad || 0,
    }))
    .sort((a, b) => b.sessions - a.sessions || b.bestLoad - a.bestLoad)
    .slice(0, 4);

  return {
    totalClients: clients.length,
    activeClients: activeClientIds.size,
    sessionsThisWeek,
    avgCompletionThisWeek,
    topClients,
  };
};

export const assignExerciseToClient = async ({ clientId, dateKey, exercise }) => {
  if (!clientId) throw new Error("Client is required.");
  const targetDateKey = dateKey || getTodayDateKey();

  const { data: existingRow, error: readError } = await supabase
    .from(WORKOUT_SESSIONS_TABLE)
    .select("session_data")
    .eq("user_id", clientId)
    .eq("date_key", targetDateKey)
    .maybeSingle();

  if (readError) throw readError;

  const plan = normalizePlan(existingRow?.session_data, targetDateKey);
  const nextExercise = buildExerciseFromInput(exercise || {});
  const updatedPlan = {
    ...plan,
    exercises: [...(plan.exercises || []), nextExercise],
    updatedAt: new Date().toISOString(),
    finishedAt: null,
  };

  const stats = getPlanStats(updatedPlan);
  const payload = {
    user_id: clientId,
    date_key: targetDateKey,
    session_data: updatedPlan,
    total_exercises: stats.totalExercises,
    completed_exercises: stats.completedExercises,
    total_sets: stats.totalSets,
    completed_sets: stats.completedSets,
    completion_rate: stats.completionRate,
    finished_at: updatedPlan.finishedAt,
    updated_at: updatedPlan.updatedAt,
  };

  const { error: writeError } = await supabase
    .from(WORKOUT_SESSIONS_TABLE)
    .upsert(payload, { onConflict: "user_id,date_key" });

  if (writeError) throw writeError;

  return {
    plan: updatedPlan,
    exercise: nextExercise,
  };
};

export const assignClientToTrainer = async ({ clientId, trainerId }) => {
  if (!clientId || !trainerId) throw new Error("Missing assignment input.");
  const { error } = await supabase
    .from(PROFILES_TABLE)
    .update({ trainer_id: trainerId })
    .eq("id", clientId)
    .eq("role", "client");
  if (error) throw error;
};

export const deleteClientAccountData = async (clientId) => {
  if (!clientId) throw new Error("Client is required.");
  const { error: sessionError } = await supabase.from(WORKOUT_SESSIONS_TABLE).delete().eq("user_id", clientId);
  if (sessionError) throw sessionError;

  const { error: profileError } = await supabase.from(PROFILES_TABLE).delete().eq("id", clientId);
  if (profileError) throw profileError;
};
