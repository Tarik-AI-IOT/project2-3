import { StyleSheet, View, ScrollView, TouchableOpacity, Pressable } from "react-native";
import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import ThemedView from "../../components/ThemedView";
import { useTheme } from "../../context/ThemeContext";
import ThemedText from "../../components/ThemedText";

const stats = [
  { label: "Workouts", value: "24", icon: "dumbbell" },
  { label: "Strength", value: "+18%", icon: "trending-up" },
  { label: "Weight", value: "-4 lbs", icon: "scale-bathroom" },
];

const strengthSeries = [
  { name: "Squat", color: "#a855f7", values: [180, 188, 185, 198, 193, 207] },
  { name: "Deadlift", color: "#22d3ee", values: [150, 162, 158, 170, 167, 176] },
  { name: "Bench", color: "#f59e0b", values: [130, 135, 133, 142, 140, 148] },
];

const chartLabels = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"];
const weightSeries = [178, 177.4, 176.6, 176.9, 175.2, 174];


const Progress = () => {
    const { theme } = useTheme();
    const router = useRouter();
    const [chartWidth, setChartWidth] = useState(0);
    const [weightChartWidth, setWeightChartWidth] = useState(0);
    const [activePoint, setActivePoint] = useState(null);
    const [activeWeightPoint, setActiveWeightPoint] = useState(null);
    const chartHeight = 170;
    const chartPadding = 10;

    const strengthRange = useMemo(() => {
      const all = strengthSeries.flatMap((series) => series.values);
      return { min: Math.min(...all), max: Math.max(...all) };
    }, []);

    const weightRange = useMemo(() => {
      return { min: Math.min(...weightSeries), max: Math.max(...weightSeries) };
    }, []);

    const getPoints = (values, range, width) => {
      if (!width) return [];
      const innerWidth = Math.max(width - chartPadding * 2, 1);
      const gap = innerWidth / (values.length - 1);
      return values.map((value, index) => {
        const normalized = (value - range.min) / (range.max - range.min || 1);
        return {
          x: chartPadding + index * gap,
          y: chartPadding + (1 - normalized) * (chartHeight - chartPadding * 2),
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
            key={`seg-${index}`}
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

    const renderDots = (points, color, seriesName) =>
      points.map((point, index) => (
        <Pressable
          key={`dot-${index}`}
          onPress={() =>
            setActivePoint({
              x: point.x,
              y: point.y,
              value: strengthSeries.find((s) => s.name === seriesName)?.values[index],
              label: chartLabels[index],
              series: seriesName,
            })
          }
          onMouseEnter={() =>
            setActivePoint({
              x: point.x,
              y: point.y,
              value: strengthSeries.find((s) => s.name === seriesName)?.values[index],
              label: chartLabels[index],
              series: seriesName,
            })
          }
          hitSlop={8}
          style={[styles.dot, { backgroundColor: color, left: point.x - 4, top: point.y - 4 }]}
        />
      ));

    const renderWeightDots = (points, color) =>
      points.map((point, index) => (
        <Pressable
          key={`weight-dot-${index}`}
          onPress={() =>
            setActiveWeightPoint({
              x: point.x,
              y: point.y,
              value: weightSeries[index],
              label: chartLabels[index],
            })
          }
          onMouseEnter={() =>
            setActiveWeightPoint({
              x: point.x,
              y: point.y,
              value: weightSeries[index],
              label: chartLabels[index],
            })
          }
          hitSlop={8}
          style={[styles.dot, { backgroundColor: color, left: point.x - 4, top: point.y - 4 }]}
        />
      ));
return (
    <ThemedView style={styles.container} safe={true}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[styles.circleButton, { backgroundColor: theme.cardBackground }]}
            accessibilityLabel="Go back"
            activeOpacity={0.8}
            onPress={() => router.push("/(dashboard)/home")}>
              <Ionicons name="chevron-back" size={18} color={theme.text} />
          </TouchableOpacity>
        </View>

          <ThemedText style={styles.title}>Your Progress</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Track your fitness journey
          </ThemedText>

          
          <View style={styles.statsRow}>
            {stats.map((item, index) => (
          <View
            key={item.label}
            style={[
              styles.statCard,
              index !== stats.length - 1 && styles.statCardSpacing,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            <View style={[styles.statIcon, { backgroundColor: theme.background }]}>
              <MaterialCommunityIcons name={item.icon} size={18} color={theme.primary} />
            </View>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              {item.label}
            </ThemedText>
            <ThemedText style={styles.statValue}>{item.value}</ThemedText>
          </View>
        ))}
      </View>

        <Pressable onPress={() => setActivePoint(null)}>
          <View style={[styles.chartCard, { backgroundColor: theme.cardBackground }]}>
          <ThemedText style={styles.cardTitle}>Strength Progression</ThemedText>

          <View style={styles.chartArea}>
            <View
              style={styles.chartCanvas}
              onLayout={(event) => setChartWidth(event.nativeEvent.layout.width)}
            >
              {[...Array(4)].map((_, index) => (
                <View
                  key={`grid-${index}`}
                  style={[
                    styles.gridLine,
                    { borderColor: theme.border, top: (chartHeight / 3) * index },
                  ]}
                  pointerEvents="none"
                />
              ))}

              {chartWidth > 0 &&
                strengthSeries.map((series) => {
                  const points = getPoints(series.values, strengthRange, chartWidth);
                  return (
                    <View key={series.name} pointerEvents="box-none">
                      {renderSegments(points, series.color)}
                      {renderDots(points, series.color, series.name)}
                    </View>
                  );
                })}
              {activePoint && (
                <View
                  pointerEvents="none"
                  style={[
                    styles.tooltip,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                      left: Math.max(activePoint.x - 36, 6),
                      top: Math.max(activePoint.y - 44, 4),
                    },
                  ]}
                >
                  <ThemedText style={[styles.tooltipText, { color: theme.textSecondary }]}>
                    {activePoint.series} • {activePoint.label}
                  </ThemedText>
                  <ThemedText style={styles.tooltipValue}>{activePoint.value} lbs</ThemedText>
                </View>
              )}
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
              <View key={series.name} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: series.color }]} />
                <ThemedText style={[styles.legendText, { color: theme.textSecondary }]}>
                  {series.name}
                </ThemedText>
              </View>
            ))}
          </View>
          </View>
        </Pressable>

        <Pressable onPress={() => setActiveWeightPoint(null)}>
          <View style={[styles.chartCard, { backgroundColor: theme.cardBackground }]}>
            <ThemedText style={styles.cardTitle}>Body Weight Evolution</ThemedText>

            <View style={styles.chartArea}>
              <View
                style={styles.chartCanvas}
                onLayout={(event) => setWeightChartWidth(event.nativeEvent.layout.width)}
              >
                {[...Array(4)].map((_, index) => (
                  <View
                    key={`grid-weight-${index}`}
                    style={[
                      styles.gridLine,
                      { borderColor: theme.border, top: (chartHeight / 3) * index },
                    ]}
                    pointerEvents="none"
                  />
                ))}

                {weightChartWidth > 0 && (() => {
                  const points = getPoints(weightSeries, weightRange, weightChartWidth);
                  return (
                    <View pointerEvents="box-none">
                      {renderSegments(points, theme.primary)}
                      {renderWeightDots(points, theme.primary)}
                    </View>
                  );
                })()}

                {activeWeightPoint && (
                  <View
                    pointerEvents="none"
                    style={[
                      styles.tooltip,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.border,
                        left: Math.max(activeWeightPoint.x - 36, 6),
                        top: Math.max(activeWeightPoint.y - 44, 4),
                      },
                    ]}
                  >
                    <ThemedText style={[styles.tooltipText, { color: theme.textSecondary }]}>
                      {activeWeightPoint.label}
                    </ThemedText>
                    <ThemedText style={styles.tooltipValue}>
                      {activeWeightPoint.value} lbs
                    </ThemedText>
                  </View>
                )}
              </View>

              <View style={styles.axisLabels}>
                {chartLabels.map((label) => (
                  <ThemedText key={label} style={[styles.axisText, { color: theme.textSecondary }]}>
                    {label}
                  </ThemedText>
                ))}
              </View>
            </View>

            <View style={styles.weightFooter}>
              <View>
                <ThemedText style={[styles.footerLabel, { color: theme.textSecondary }]}>
                  Current
                </ThemedText>
                <ThemedText style={styles.footerValue}>174 lbs</ThemedText>
              </View>
              <View style={styles.footerRight}>
                <ThemedText style={[styles.footerLabel, { color: theme.textSecondary }]}>
                  Goal
                </ThemedText>
                <ThemedText style={styles.footerValue}>170 lbs</ThemedText>
              </View>
            </View>
          </View>
        </Pressable>
      </ScrollView>
    </ThemedView>
  )
};

export default Progress

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
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    minHeight: 110,
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
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
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
    height: 170,
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
  weightFooter: {
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
});
