import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { getDatabase } from '@/db/database';
import { getDailyStats, getWeeklyStats } from '@/db/repositories/statsRepo';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { todayDateString, addDays } from '@/services/planningAlgorithm';
import type { DailyStats } from '@/types';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const [daily, setDaily] = useState<DailyStats[]>([]);
  const [weekly, setWeekly] = useState<{ weekStart: string; plannedCount: number; doneCount: number }[]>([]);
  const [completionRate, setCompletionRate] = useState(0);

  useEffect(() => {
    async function load() {
      const db = await getDatabase();
      const today = todayDateString();
      const from30 = addDays(today, -29);
      const [d, w] = await Promise.all([
        getDailyStats(db, from30, today),
        getWeeklyStats(db, 8),
      ]);
      setDaily(d);
      setWeekly(w);

      const totalPlanned = d.reduce((s, r) => s + r.plannedCount, 0);
      const totalDone = d.reduce((s, r) => s + r.doneCount, 0);
      setCompletionRate(totalPlanned > 0 ? Math.round((totalDone / totalPlanned) * 100) : 0);
    }
    load();
  }, []);

  // Last 7 days bar chart data
  const last7 = daily.slice(-7);
  const barData = last7.flatMap(d => [
    { value: d.plannedCount, label: d.date.slice(5), frontColor: Colors.planned + 'AA' },
    { value: d.doneCount, label: '', frontColor: Colors.done },
  ]);

  // Weekly line chart
  const lineDataPlanned = weekly.map(w => ({ value: w.plannedCount }));
  const lineDataDone = weekly.map(w => ({ value: w.doneCount }));

  const todayStats = daily.find(d => d.date === todayDateString());
  const totalBacklog = daily.reduce(
    (sum, d) => sum + Math.max(0, d.plannedCount - d.doneCount - d.skippedCount),
    0
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Summary cards */}
      <View style={styles.row}>
        <SummaryCard
          label="Aujourd'hui"
          value={`${todayStats?.doneCount ?? 0}/${todayStats?.plannedCount ?? 0}`}
          sub="Fait / Planifié"
          color={Colors.primary}
        />
        <SummaryCard
          label="Taux 30j"
          value={`${completionRate}%`}
          sub="Complétion"
          color={Colors.done}
        />
        <SummaryCard
          label="Backlog"
          value={String(totalBacklog)}
          sub="En attente"
          color={Colors.backlog}
        />
      </View>

      {/* Bar chart: last 7 days */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>7 derniers jours — Planifié vs Fait</Text>
        {barData.length > 0 ? (
          <BarChart
            data={barData}
            barWidth={14}
            spacing={4}
            roundedTop
            hideRules
            xAxisThickness={1}
            yAxisThickness={0}
            yAxisTextStyle={{ color: Colors.textLight, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: Colors.textLight, fontSize: 9 }}
            noOfSections={5}
            maxValue={Math.max(...barData.map(d => d.value), 5)}
            width={width - 80}
          />
        ) : (
          <Text style={styles.noData}>Aucune donnée disponible</Text>
        )}
        <View style={styles.legend}>
          <LegendDot color={Colors.planned + 'AA'} label="Planifié" />
          <LegendDot color={Colors.done} label="Fait" />
        </View>
      </View>

      {/* Line chart: weekly trends */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tendance hebdomadaire</Text>
        {lineDataDone.length > 1 ? (
          <LineChart
            data={lineDataPlanned}
            data2={lineDataDone}
            color1={Colors.planned}
            color2={Colors.done}
            thickness={2}
            hideDataPoints={false}
            dataPointsColor1={Colors.planned}
            dataPointsColor2={Colors.done}
            yAxisTextStyle={{ color: Colors.textLight, fontSize: 10 }}
            xAxisThickness={1}
            yAxisThickness={0}
            width={width - 80}
            noOfSections={4}
            curved
          />
        ) : (
          <Text style={styles.noData}>Pas assez de données</Text>
        )}
        <View style={styles.legend}>
          <LegendDot color={Colors.planned} label="Planifié" />
          <LegendDot color={Colors.done} label="Fait" />
        </View>
      </View>

      {/* Recent days table */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Historique récent</Text>
        {daily.slice(-14).reverse().map(d => (
          <View key={d.date} style={styles.histRow}>
            <Text style={styles.histDate}>{d.date}</Text>
            <View style={styles.histBar}>
              <View
                style={[styles.histFill, {
                  width: `${d.plannedCount > 0 ? (d.doneCount / d.plannedCount) * 100 : 0}%`,
                  backgroundColor: Colors.done,
                }]}
              />
            </View>
            <Text style={styles.histLabel}>{d.doneCount}/{d.plannedCount}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function SummaryCard({
  label, value, sub, color,
}: { label: string; value: string; sub: string; color: string }) {
  return (
    <View style={[styles.summaryCard, { borderTopColor: color }]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summarySub}>{sub}</Text>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderTopWidth: 3,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginBottom: 2 },
  summaryValue: { fontSize: FontSizes.xxl, fontWeight: '700' },
  summarySub: { fontSize: FontSizes.xs, color: Colors.textLight },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  noData: { color: Colors.textLight, textAlign: 'center', paddingVertical: Spacing.lg },
  legend: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  histRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: Spacing.sm,
  },
  histDate: { width: 90, fontSize: FontSizes.xs, color: Colors.textSecondary },
  histBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  histFill: { height: 8, borderRadius: 4 },
  histLabel: { width: 36, fontSize: FontSizes.xs, color: Colors.textSecondary, textAlign: 'right' },
});
