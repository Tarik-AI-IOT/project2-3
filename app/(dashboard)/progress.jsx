import { StyleSheet, View, ScrollView, TouchableOpacity, Pressable } from "react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import ThemedView from "../../components/ThemedView";
import { useTheme } from "../../context/ThemeContext";
import ThemedText from "../../components/ThemedText";
import { useUser } from "../../hooks/useUser";
import { getWorkoutStats, loadWorkoutHistory } from "../../services/workoutPlan";

const TRACKED_EXERCISES = [
  { key: "squat", names: ["Barbell Squat", "Squat"], color: "#a855f7", label: "Squat" },
  { key: "deadlift", names: ["Romanian Deadlift", "Deadlift", "Barbell Deadlift"], color: "#22d3ee", label: "Deadlift" },
  { key: "bench-press", names: ["Bench Press", "Barbell Bench Press", "Leg Press"], color: "#f59e0b", label: "Bench Press" },
];

const CHART_HEIGHT = 170;
const CHART_PADDING = 10;
const GUIDE_TOP_OFFSETS = [0, CHART_HEIGHT / 2 - 8, CHART_HEIGHT - 16];
const TIMEFRAME_DAILY = "daily";
const TIMEFRAME_WEEKLY = "weekly";
const DEFAULT_HISTORY_LIMIT = 42;

const withAlpha = (color, alpha = "1f") =>
  typeof color === "string" && color.startsWith("#") && color.length === 7 ? `${color}${alpha}` : color;

const shouldShowAxisLabel = (index, total) => total <= 5 || index === 0 || index === total - 1 || index % 2 === 0;

const buildGuideValues = (range) => {
  const mid = range.min + (range.max - range.min) / 2;
  return [range.max, mid, range.min].map((value) => Math.max(0, Math.round(value)));
};

const parseWeight = (value) => {
  const numeric = parseFloat(String(value ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
};

const toDateLabel = (dateKey) => {
  const [year, month, day] = String(dateKey || "").split("-").map(Number);
  const date = year && month && day ? new Date(year, month - 1, day) : new Date();
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
};

const parseDateKey = (dateKey) => {
  const [year, month, day] = String(dateKey || "").split("-").map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
};

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getWeekStart = (dateInput) => {
  const date = new Date(dateInput);
  date.setHours(0, 0, 0, 0);
  const dayOffset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - dayOffset);
  return date;
};

const getIsoWeekInfo = (dateInput) => {
  const date = new Date(Date.UTC(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return { year: date.getUTCFullYear(), week };
};

const toWeekLabel = (weekStart) => {
  const { week } = getIsoWeekInfo(weekStart);
  return `Wk ${week}`;
};

const maxOrNull = (current, value) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return current;
  if (typeof current !== "number" || !Number.isFinite(current)) return value;
  return Math.max(current, value);
};

const getExerciseSessionMax = (session, exerciseNames) => {
  const names = Array.isArray(exerciseNames) ? exerciseNames : [exerciseNames];
  const normalizedNames = names.map((name) => String(name || "").toLowerCase()).filter(Boolean);

  const exercise = session.exercises.find((item) =>
    normalizedNames.includes(String(item.displayName || "").toLowerCase())
  );
  if (!exercise) return null;

  const completedWeights = exercise.setLogs
    .filter((setLog) => setLog.completed)
    .map((setLog) => parseWeight(setLog.actualWeight))
    .filter((weight) => typeof weight === "number");

  if (!completedWeights.length) return null;
  return Math.max(...completedWeights);
};

const getSessionTopWeight = (session) => {
  const weights = session.exercises
    .flatMap((exercise) => exercise.setLogs)
    .filter((setLog) => setLog.completed)
    .map((setLog) => parseWeight(setLog.actualWeight))
    .filter((weight) => typeof weight === "number");

  if (!weights.length) return 0;
  return Math.max(...weights);
};

const buildDailyChartUnits = (sessions) =>
  sessions.map((session) => {
    const exerciseMaxes = TRACKED_EXERCISES.reduce((acc, exercise) => {
      acc[exercise.key] = getExerciseSessionMax(session, exercise.names);
      return acc;
    }, {});

    return {
      dateKey: session.dateKey,
      label: toDateLabel(session.dateKey),
      sessionTopWeight: getSessionTopWeight(session),
      completionRate: getWorkoutStats(session).completionRate,
      sessionsCount: 1,
      exerciseMaxes,
    };
  });

const buildWeeklyChartUnits = (sessions) => {
  const grouped = new Map();

  sessions.forEach((session) => {
    const date = parseDateKey(session.dateKey);
    const weekStart = getWeekStart(date);
    const weekKey = toDateKey(weekStart);
    const existing = grouped.get(weekKey) || {
      dateKey: weekKey,
      label: toWeekLabel(weekStart),
      sessionTopWeight: 0,
      completionRates: [],
      sessionsCount: 0,
      exerciseMaxes: TRACKED_EXERCISES.reduce((acc, exercise) => {
        acc[exercise.key] = null;
        return acc;
      }, {}),
    };

    existing.sessionTopWeight = Math.max(existing.sessionTopWeight, getSessionTopWeight(session));
    existing.completionRates.push(getWorkoutStats(session).completionRate);
    existing.sessionsCount += 1;

    TRACKED_EXERCISES.forEach((exercise) => {
      const nextMax = getExerciseSessionMax(session, exercise.names);
      existing.exerciseMaxes[exercise.key] = maxOrNull(existing.exerciseMaxes[exercise.key], nextMax);
    });

    grouped.set(weekKey, existing);
  });

  return [...grouped.values()]
    .sort((a, b) => String(a.dateKey).localeCompare(String(b.dateKey)))
    .map((week) => ({
      dateKey: week.dateKey,
      label: week.label,
      sessionTopWeight: week.sessionTopWeight,
      completionRate: week.completionRates.length
        ? week.completionRates.reduce((sum, value) => sum + value, 0) / week.completionRates.length
        : 0,
      sessionsCount: week.sessionsCount,
      exerciseMaxes: week.exerciseMaxes,
    }));
};

const carryForwardValues = (values) => {
  let last = 0;
  return values.map((value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      last = value;
      return value;
    }
    return last;
  });
};

const buildRange = (seriesList) => {
  const flattened = seriesList.flat().filter((value) => typeof value === "number" && Number.isFinite(value));
  const positive = flattened.filter((value) => value > 0);
  if (!positive.length) return { min: 0, max: 1 };

  const min = Math.min(...positive);
  const max = Math.max(...positive);
  if (min === max) return { min: Math.max(0, min - 5), max: max + 5 };

  const pad = Math.max((max - min) * 0.15, 3);
  return { min: Math.max(0, min - pad), max: max + pad };
};

const Progress = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useUser();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeframe, setTimeframe] = useState(TIMEFRAME_DAILY);
  const [maxChartWidth, setMaxChartWidth] = useState(0);
  const [prChartWidth, setPrChartWidth] = useState(0);
  const [activePoint, setActivePoint] = useState(null);
  const [activePrPoint, setActivePrPoint] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const load = async () => {
        try {
          setLoading(true);
          setError("");
          const history = await loadWorkoutHistory(user?.id, DEFAULT_HISTORY_LIMIT);
          if (active) setSessions(history);
        } catch {
          if (active) setError("Could not load progress history.");
        } finally {
          if (active) setLoading(false);
        }
      };

      load();
      return () => {
        active = false;
      };
    }, [user?.id])
  );

  useEffect(() => {
    setActivePoint(null);
    setActivePrPoint(null);
  }, [timeframe]);

  const chartUnits = useMemo(
    () => (timeframe === TIMEFRAME_WEEKLY ? buildWeeklyChartUnits(sessions) : buildDailyChartUnits(sessions)),
    [sessions, timeframe]
  );

  const chartLabels = useMemo(() => chartUnits.map((unit) => unit.label), [chartUnits]);

  const strengthSeries = useMemo(
    () =>
      TRACKED_EXERCISES.map((exercise) => {
        const rawValues = chartUnits.map((unit) => unit.exerciseMaxes[exercise.key]);
        return {
          ...exercise,
          rawValues,
          values: carryForwardValues(rawValues),
        };
      }),
    [chartUnits]
  );

  const sessionMaxSeries = useMemo(() => chartUnits.map((unit) => unit.sessionTopWeight), [chartUnits]);

  const prSeries = useMemo(() => {
    let runningMax = 0;
    return sessionMaxSeries.map((value) => {
      runningMax = Math.max(runningMax, value);
      return runningMax;
    });
  }, [sessionMaxSeries]);

  const strengthRange = useMemo(() => buildRange(strengthSeries.map((series) => series.values)), [strengthSeries]);
  const prRange = useMemo(() => buildRange([prSeries]), [prSeries]);
  const strengthGuides = useMemo(() => buildGuideValues(strengthRange), [strengthRange]);
  const prGuides = useMemo(() => buildGuideValues(prRange), [prRange]);

  const stats = useMemo(() => {
    const totalPeriods = chartUnits.length;
    const bestPr = prSeries.length ? Math.max(...prSeries) : 0;
    const avgCompletion =
      totalPeriods > 0
        ? Math.round(
            (chartUnits.reduce((sum, unit) => sum + unit.completionRate, 0) / totalPeriods) * 100
          )
        : 0;
    const latestMax = chartUnits.length ? chartUnits[chartUnits.length - 1].sessionTopWeight : 0;

    return {
      totalPeriods,
      bestPr,
      avgCompletion,
      latestMax,
    };
  }, [chartUnits, prSeries]);

  const isWeeklyView = timeframe === TIMEFRAME_WEEKLY;
  const periodStatLabel = isWeeklyView ? "Weeks" : "Sessions";
  const maxLoadTitle = isWeeklyView ? "Max Load by Week" : "Max Load by Session";
  const latestMaxLabel = isWeeklyView ? "Latest Week Max" : "Latest Session Max";

  const getPoints = (values, range, width) => {
    if (!width || !values.length) return [];
    const innerWidth = Math.max(width - CHART_PADDING * 2, 1);
    const gap = values.length > 1 ? innerWidth / (values.length - 1) : 0;

    return values.map((value, index) => {
      const normalized = (value - range.min) / (range.max - range.min || 1);
      return {
        x: values.length > 1 ? CHART_PADDING + index * gap : CHART_PADDING + innerWidth / 2,
        y: CHART_PADDING + (1 - normalized) * (CHART_HEIGHT - CHART_PADDING * 2),
      };
    });
  };

  const renderSegments = (points, color, thickness = 2, opacity = 1) =>
    points.slice(0, -1).map((point, index) => {
      const next = points[index + 1];
      const dx = next.x - point.x;
      const dy = next.y - point.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const midX = (point.x + next.x) / 2;
      const midY = (point.y + next.y) / 2;

      return (
        <View
          key={`segment-${index}-${color}`}
          style={[
            styles.segment,
            {
              width: length,
              height: thickness,
              backgroundColor: color,
              left: midX - length / 2,
              top: midY - thickness / 2,
              transform: [{ rotateZ: `${angle}deg` }],
              opacity,
            },
          ]}
          pointerEvents="none"
        />
      );
    });

  const renderDots = ({ points, color, values, seriesName, size = 10 }) =>
    points.map((point, index) => {
      const radius = size / 2;
      return (
        <Pressable
          key={`dot-${seriesName}-${index}`}
          onPress={() =>
            setActivePoint({
              x: point.x,
              y: point.y,
              value: values[index],
              label: chartLabels[index],
              series: seriesName,
              sessionsCount: chartUnits[index]?.sessionsCount || 1,
            })
          }
          onMouseEnter={() =>
            setActivePoint({
              x: point.x,
              y: point.y,
              value: values[index],
              label: chartLabels[index],
              series: seriesName,
              sessionsCount: chartUnits[index]?.sessionsCount || 1,
            })
          }
          hitSlop={8}
          style={[
            styles.dot,
            {
              width: size,
              height: size,
              borderRadius: radius,
              backgroundColor: color,
              borderColor: theme.background,
              left: point.x - radius,
              top: point.y - radius,
              opacity: values[index] > 0 ? 1 : 0.45,
            },
          ]}
        />
      );
    });

  const renderPrDots = (points) =>
    points.map((point, index) => (
      <Pressable
        key={`pr-dot-${index}`}
        onPress={() =>
          setActivePrPoint({
            x: point.x,
            y: point.y,
            value: prSeries[index],
            label: chartLabels[index],
            sessionMax: sessionMaxSeries[index],
            sessionsCount: chartUnits[index]?.sessionsCount || 1,
          })
        }
        onMouseEnter={() =>
          setActivePrPoint({
            x: point.x,
            y: point.y,
            value: prSeries[index],
            label: chartLabels[index],
            sessionMax: sessionMaxSeries[index],
            sessionsCount: chartUnits[index]?.sessionsCount || 1,
          })
        }
        hitSlop={10}
        style={[
          styles.dot,
          styles.prDot,
          {
            backgroundColor: theme.primary,
            borderColor: theme.background,
            left: point.x - 6,
            top: point.y - 6,
          },
        ]}
      />
    ));

  if (loading) {
    return (
      <ThemedView style={styles.container} safe={true} safeBottom={false}>
        <View style={styles.stateWrap}>
          <ThemedText style={{ color: theme.textSecondary }}>Loading progress...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container} safe={true} safeBottom={false}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[styles.circleButton, { backgroundColor: theme.cardBackground }]}
            accessibilityLabel="Go back"
            activeOpacity={0.8}
            onPress={() => router.push("/(dashboard)/home")}
          >
            <Ionicons name="chevron-back" size={18} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ThemedText style={styles.title}>Your Progress</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          {isWeeklyView
            ? "Weekly trends from your logged sessions."
            : "Real session logs, PR trends, and max load progression."}
        </ThemedText>

        <View style={[styles.timeframeWrap, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <TouchableOpacity
            style={[
              styles.timeframeButton,
              isWeeklyView
                ? { backgroundColor: "transparent" }
                : { backgroundColor: withAlpha(theme.primary, "26") },
            ]}
            activeOpacity={0.85}
            onPress={() => setTimeframe(TIMEFRAME_DAILY)}
          >
            <ThemedText
              style={[
                styles.timeframeText,
                { color: isWeeklyView ? theme.textSecondary : theme.primary },
              ]}
            >
              Daily
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.timeframeButton,
              isWeeklyView
                ? { backgroundColor: withAlpha(theme.primary, "26") }
                : { backgroundColor: "transparent" },
            ]}
            activeOpacity={0.85}
            onPress={() => setTimeframe(TIMEFRAME_WEEKLY)}
          >
            <ThemedText
              style={[
                styles.timeframeText,
                { color: isWeeklyView ? theme.primary : theme.textSecondary },
              ]}
            >
              Weekly
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardSpacing, { backgroundColor: theme.cardBackground }]}>
            <View style={[styles.statIcon, { backgroundColor: theme.background }]}>
              <MaterialCommunityIcons name="calendar-check" size={18} color={theme.primary} />
            </View>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>{periodStatLabel}</ThemedText>
            <ThemedText style={styles.statValue}>{stats.totalPeriods}</ThemedText>
          </View>
          <View style={[styles.statCard, styles.statCardSpacing, { backgroundColor: theme.cardBackground }]}>
            <View style={[styles.statIcon, { backgroundColor: theme.background }]}>
              <MaterialCommunityIcons name="trophy-outline" size={18} color={theme.primary} />
            </View>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Best PR</ThemedText>
            <ThemedText style={styles.statValue}>{stats.bestPr ? `${stats.bestPr} lbs` : "-"}</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <View style={[styles.statIcon, { backgroundColor: theme.background }]}>
              <MaterialCommunityIcons name="check-decagram-outline" size={18} color={theme.primary} />
            </View>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Completion</ThemedText>
            <ThemedText style={styles.statValue}>{stats.avgCompletion}%</ThemedText>
          </View>
        </View>

        {error ? <ThemedText style={{ color: theme.error, marginBottom: 10 }}>{error}</ThemedText> : null}

        {!sessions.length ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <ThemedText style={styles.emptyTitle}>No logged sessions yet</ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              Finish your first workout session to unlock PR and max-weight charts.
            </ThemedText>
          </View>
        ) : (
          <>
            <Pressable onPress={() => setActivePoint(null)}>
              <View style={[styles.chartCard, { backgroundColor: theme.cardBackground }]}>
                <ThemedText style={styles.cardTitle}>{maxLoadTitle}</ThemedText>

                <View style={styles.chartArea}>
                  <View
                    style={styles.chartCanvas}
                    onLayout={(event) => setMaxChartWidth(event.nativeEvent.layout.width)}
                  >
                    {[...Array(4)].map((_, index) => (
                      <View
                        key={`grid-max-${index}`}
                        style={[
                          styles.gridLine,
                          { borderColor: theme.border, top: (CHART_HEIGHT / 3) * index },
                        ]}
                        pointerEvents="none"
                      />
                    ))}

                    <View pointerEvents="none" style={styles.valueGuides}>
                      {strengthGuides.map((guide, index) => (
                        <ThemedText
                          key={`max-guide-${index}`}
                          style={[
                            styles.valueGuideText,
                            {
                              color: theme.textSecondary,
                              top: GUIDE_TOP_OFFSETS[index],
                            },
                          ]}
                        >
                          {guide}
                        </ThemedText>
                      ))}
                    </View>

                    {maxChartWidth > 0 &&
                      strengthSeries.map((series) => {
                        const points = getPoints(series.values, strengthRange, maxChartWidth);
                        return (
                          <View key={series.key} pointerEvents="box-none">
                            {renderSegments(points, series.color, 2.4, 0.95)}
                            {renderDots({
                              points,
                              color: series.color,
                              values: series.values,
                              seriesName: series.label,
                              size: 10,
                            })}
                          </View>
                        );
                      })}

                    {activePoint ? (
                      <View
                        pointerEvents="none"
                        style={[
                          styles.tooltip,
                          {
                            backgroundColor: theme.background,
                            borderColor: theme.border,
                            left: Math.max(activePoint.x - 44, 6),
                            top: Math.max(activePoint.y - 46, 4),
                          },
                        ]}
                      >
                        <ThemedText style={[styles.tooltipText, { color: theme.textSecondary }]}>
                          {activePoint.series} - {activePoint.label}
                        </ThemedText>
                        {isWeeklyView ? (
                          <ThemedText style={[styles.tooltipText, { color: theme.textSecondary }]}>
                            {activePoint.sessionsCount} sessions
                          </ThemedText>
                        ) : null}
                        <ThemedText style={styles.tooltipValue}>{Math.round(activePoint.value)} lbs</ThemedText>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.axisLabels}>
                    {chartLabels.map((label, index) => (
                      <ThemedText
                        key={`${label}-${index}`}
                        style={[
                          styles.axisText,
                          { color: theme.textSecondary },
                          !shouldShowAxisLabel(index, chartLabels.length) && styles.axisTextMuted,
                        ]}
                      >
                        {shouldShowAxisLabel(index, chartLabels.length) ? label : "."}
                      </ThemedText>
                    ))}
                  </View>
                </View>

                <View style={styles.legendRow}>
                  {strengthSeries.map((series) => (
                    <View key={series.key} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: series.color }]} />
                      <ThemedText style={[styles.legendText, { color: theme.textSecondary }]}>{series.label}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            </Pressable>

            <Pressable onPress={() => setActivePrPoint(null)}>
              <View
                style={[
                  styles.chartCard,
                  styles.prCard,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: withAlpha(theme.primary, "4d"),
                  },
                ]}
              >
                <View style={[styles.prGlow, { backgroundColor: withAlpha(theme.primary, "1a") }]} />
                <View style={styles.prHeader}>
                  <View style={[styles.prHeaderIcon, { backgroundColor: withAlpha(theme.primary, "22") }]}>
                    <MaterialCommunityIcons name="trending-up" size={16} color={theme.primary} />
                  </View>
                  <View style={styles.prHeaderCopy}>
                    <ThemedText style={styles.prTitle}>PR Progression</ThemedText>
                    <ThemedText style={[styles.prSubtitle, { color: theme.textSecondary }]}>
                      {isWeeklyView ? "Running best across your weeks" : "Running best across your sessions"}
                    </ThemedText>
                  </View>
                  <View
                    style={[
                      styles.prBadge,
                      {
                        backgroundColor: withAlpha(theme.primary, "18"),
                        borderColor: withAlpha(theme.primary, "4d"),
                      },
                    ]}
                  >
                    <ThemedText style={[styles.prBadgeText, { color: theme.primary }]}>
                      {stats.bestPr ? `${stats.bestPr} lbs` : "No PR"}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.chartArea}>
                  <View style={styles.chartCanvas} onLayout={(event) => setPrChartWidth(event.nativeEvent.layout.width)}>
                    {[...Array(4)].map((_, index) => (
                      <View
                        key={`grid-pr-${index}`}
                        style={[
                          styles.gridLine,
                          { borderColor: theme.border, top: (CHART_HEIGHT / 3) * index },
                        ]}
                        pointerEvents="none"
                      />
                    ))}

                    <View pointerEvents="none" style={styles.valueGuides}>
                      {prGuides.map((guide, index) => (
                        <ThemedText
                          key={`pr-guide-${index}`}
                          style={[
                            styles.valueGuideText,
                            {
                              color: theme.textSecondary,
                              top: GUIDE_TOP_OFFSETS[index],
                            },
                          ]}
                        >
                          {guide}
                        </ThemedText>
                      ))}
                    </View>

                    {prChartWidth > 0 ? (() => {
                      const points = getPoints(prSeries, prRange, prChartWidth);
                      return (
                        <View pointerEvents="box-none">
                          {renderSegments(points, theme.primary, 3.4, 1)}
                          {renderPrDots(points)}
                        </View>
                      );
                    })() : null}

                    {activePrPoint ? (
                      <View
                        pointerEvents="none"
                        style={[
                          styles.tooltip,
                          {
                            backgroundColor: theme.background,
                            borderColor: theme.border,
                            left: Math.max(activePrPoint.x - 44, 6),
                            top: Math.max(activePrPoint.y - 46, 4),
                          },
                        ]}
                      >
                        <ThemedText style={[styles.tooltipText, { color: theme.textSecondary }]}>
                          {activePrPoint.label}
                        </ThemedText>
                        {isWeeklyView ? (
                          <ThemedText style={[styles.tooltipText, { color: theme.textSecondary }]}>
                            {activePrPoint.sessionsCount} sessions
                          </ThemedText>
                        ) : null}
                        <ThemedText style={styles.tooltipValue}>PR {Math.round(activePrPoint.value)} lbs</ThemedText>
                        <ThemedText style={[styles.tooltipText, { color: theme.textSecondary }]}>
                          {isWeeklyView ? "Week Max" : "Session Max"} {Math.round(activePrPoint.sessionMax)} lbs
                        </ThemedText>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.axisLabels}>
                    {chartLabels.map((label, index) => (
                      <ThemedText
                        key={`${label}-${index}`}
                        style={[
                          styles.axisText,
                          { color: theme.textSecondary },
                          !shouldShowAxisLabel(index, chartLabels.length) && styles.axisTextMuted,
                        ]}
                      >
                        {shouldShowAxisLabel(index, chartLabels.length) ? label : "."}
                      </ThemedText>
                    ))}
                  </View>
                </View>

                <View style={styles.prFooter}>
                  <View>
                    <ThemedText style={[styles.footerLabel, { color: theme.textSecondary }]}>{latestMaxLabel}</ThemedText>
                    <ThemedText style={styles.footerValue}>{stats.latestMax ? `${stats.latestMax} lbs` : "-"}</ThemedText>
                  </View>
                  <View style={styles.footerRight}>
                    <ThemedText style={[styles.footerLabel, { color: theme.textSecondary }]}>Current PR</ThemedText>
                    <ThemedText style={styles.footerValue}>{stats.bestPr ? `${stats.bestPr} lbs` : "-"}</ThemedText>
                  </View>
                </View>
              </View>
            </Pressable>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
};

export default Progress;

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
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 18,
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    marginBottom: 10,
  },
  timeframeWrap: {
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    flexDirection: "row",
  },
  timeframeButton: {
    flex: 1,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  timeframeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    minHeight: 112,
    justifyContent: "space-between",
  },
  statCardSpacing: {
    marginRight: 12,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    marginTop: 10,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 17,
    fontWeight: "700",
  },
  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
  },
  chartCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "transparent",
    overflow: "hidden",
  },
  prCard: {
    borderWidth: 1.2,
  },
  prGlow: {
    position: "absolute",
    right: -52,
    top: -48,
    width: 170,
    height: 170,
    borderRadius: 85,
    opacity: 0.9,
  },
  prHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  prHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  prHeaderCopy: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  prTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  prSubtitle: {
    marginTop: 2,
    fontSize: 11,
  },
  prBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  prBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  chartArea: {
    marginBottom: 14,
  },
  chartCanvas: {
    height: CHART_HEIGHT,
    position: "relative",
  },
  valueGuides: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 42,
    pointerEvents: "none",
  },
  valueGuideText: {
    position: "absolute",
    left: 0,
    fontSize: 10,
    fontWeight: "600",
    opacity: 0.75,
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: 1,
    opacity: 0.4,
  },
  segment: {
    position: "absolute",
    borderRadius: 999,
  },
  dot: {
    position: "absolute",
    borderWidth: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 3,
    elevation: 2,
  },
  prDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  tooltip: {
    position: "absolute",
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  tooltipText: {
    fontSize: 10,
  },
  tooltipValue: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
  },
  axisLabels: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  axisText: {
    fontSize: 10,
  },
  axisTextMuted: {
    opacity: 0.36,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
  },
  prFooter: {
    marginTop: 2,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerLabel: {
    fontSize: 12,
  },
  footerValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "700",
  },
  footerRight: {
    alignItems: "flex-end",
  },
  stateWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
