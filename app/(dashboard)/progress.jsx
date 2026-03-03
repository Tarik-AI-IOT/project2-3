import { StyleSheet, View, ScrollView, TouchableOpacity, Pressable } from "react-native";
import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import ThemedView from "../../components/ThemedView";
import { useTheme } from "../../context/ThemeContext";
import ThemedText from "../../components/ThemedText";
import { useUser } from "../../hooks/useUser";
import { getWorkoutStats, loadWorkoutHistory } from "../../services/workoutPlan";

const TRACKED_EXERCISES = [
  { key: "squat", name: "Barbell Squat", color: "#a855f7", label: "Squat" },
  { key: "rdl", name: "Romanian Deadlift", color: "#22d3ee", label: "RDL" },
  { key: "leg-press", name: "Leg Press", color: "#f59e0b", label: "Leg Press" },
];

const CHART_HEIGHT = 170;
const CHART_PADDING = 10;

const parseWeight = (value) => {
  const numeric = parseFloat(String(value ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
};

const toDateLabel = (dateKey) => {
  const [year, month, day] = String(dateKey || "").split("-").map(Number);
  const date = year && month && day ? new Date(year, month - 1, day) : new Date();
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
};

const getExerciseSessionMax = (session, exerciseName) => {
  const exercise = session.exercises.find(
    (item) => String(item.displayName || "").toLowerCase() === String(exerciseName || "").toLowerCase()
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
          const history = await loadWorkoutHistory(user?.id, 8);
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

  const chartLabels = useMemo(() => sessions.map((session) => toDateLabel(session.dateKey)), [sessions]);

  const strengthSeries = useMemo(
    () =>
      TRACKED_EXERCISES.map((exercise) => {
        const rawValues = sessions.map((session) => getExerciseSessionMax(session, exercise.name));
        return {
          ...exercise,
          rawValues,
          values: carryForwardValues(rawValues),
        };
      }),
    [sessions]
  );

  const sessionMaxSeries = useMemo(
    () => sessions.map((session) => getSessionTopWeight(session)),
    [sessions]
  );

  const prSeries = useMemo(() => {
    let runningMax = 0;
    return sessionMaxSeries.map((value) => {
      runningMax = Math.max(runningMax, value);
      return runningMax;
    });
  }, [sessionMaxSeries]);

  const strengthRange = useMemo(() => buildRange(strengthSeries.map((series) => series.values)), [strengthSeries]);
  const prRange = useMemo(() => buildRange([prSeries]), [prSeries]);

  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    const bestPr = prSeries.length ? Math.max(...prSeries) : 0;
    const avgCompletion =
      totalSessions > 0
        ? Math.round(
            (sessions.reduce((sum, session) => sum + getWorkoutStats(session).completionRate, 0) / totalSessions) * 100
          )
        : 0;
    const latestSession = sessions.length ? sessions[sessions.length - 1] : null;
    const latestMax = latestSession ? getSessionTopWeight(latestSession) : 0;

    return {
      totalSessions,
      bestPr,
      avgCompletion,
      latestMax,
    };
  }, [sessions, prSeries]);

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

  const renderSegments = (points, color) =>
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
              backgroundColor: color,
              left: midX - length / 2,
              top: midY - 1,
              transform: [{ rotateZ: `${angle}deg` }],
            },
          ]}
          pointerEvents="none"
        />
      );
    });

  const renderDots = ({ points, color, values, seriesName }) =>
    points.map((point, index) => (
      <Pressable
        key={`dot-${seriesName}-${index}`}
        onPress={() =>
          setActivePoint({
            x: point.x,
            y: point.y,
            value: values[index],
            label: chartLabels[index],
            series: seriesName,
          })
        }
        onMouseEnter={() =>
          setActivePoint({
            x: point.x,
            y: point.y,
            value: values[index],
            label: chartLabels[index],
            series: seriesName,
          })
        }
        hitSlop={8}
        style={[styles.dot, { backgroundColor: color, left: point.x - 4, top: point.y - 4 }]}
      />
    ));

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
          })
        }
        onMouseEnter={() =>
          setActivePrPoint({
            x: point.x,
            y: point.y,
            value: prSeries[index],
            label: chartLabels[index],
            sessionMax: sessionMaxSeries[index],
          })
        }
        hitSlop={8}
        style={[styles.dot, { backgroundColor: theme.primary, left: point.x - 4, top: point.y - 4 }]}
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
          Real session logs, PR trends, and max load progression.
        </ThemedText>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardSpacing, { backgroundColor: theme.cardBackground }]}>
            <View style={[styles.statIcon, { backgroundColor: theme.background }]}>
              <MaterialCommunityIcons name="calendar-check" size={18} color={theme.primary} />
            </View>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Sessions</ThemedText>
            <ThemedText style={styles.statValue}>{stats.totalSessions}</ThemedText>
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
                <ThemedText style={styles.cardTitle}>Max Load by Session</ThemedText>

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

                    {maxChartWidth > 0 &&
                      strengthSeries.map((series) => {
                        const points = getPoints(series.values, strengthRange, maxChartWidth);
                        return (
                          <View key={series.key} pointerEvents="box-none">
                            {renderSegments(points, series.color)}
                            {renderDots({
                              points,
                              color: series.color,
                              values: series.values,
                              seriesName: series.label,
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
                        <ThemedText style={styles.tooltipValue}>{Math.round(activePoint.value)} lbs</ThemedText>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.axisLabels}>
                    {chartLabels.map((label) => (
                      <ThemedText key={label} style={[styles.axisText, { color: theme.textSecondary }]}>
                        {label}
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
              <View style={[styles.chartCard, { backgroundColor: theme.cardBackground }]}>
                <ThemedText style={styles.cardTitle}>PR Progression</ThemedText>

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

                    {prChartWidth > 0 ? (() => {
                      const points = getPoints(prSeries, prRange, prChartWidth);
                      return (
                        <View pointerEvents="box-none">
                          {renderSegments(points, theme.primary)}
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
                        <ThemedText style={styles.tooltipValue}>PR {Math.round(activePrPoint.value)} lbs</ThemedText>
                        <ThemedText style={[styles.tooltipText, { color: theme.textSecondary }]}>
                          Session Max {Math.round(activePrPoint.sessionMax)} lbs
                        </ThemedText>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.axisLabels}>
                    {chartLabels.map((label) => (
                      <ThemedText key={label} style={[styles.axisText, { color: theme.textSecondary }]}>
                        {label}
                      </ThemedText>
                    ))}
                  </View>
                </View>

                <View style={styles.prFooter}>
                  <View>
                    <ThemedText style={[styles.footerLabel, { color: theme.textSecondary }]}>Latest Session Max</ThemedText>
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
    marginBottom: 16,
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
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: 1,
    opacity: 0.4,
  },
  segment: {
    position: "absolute",
    height: 2,
    borderRadius: 2,
  },
  dot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tooltip: {
    position: "absolute",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
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
    fontSize: 11,
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
