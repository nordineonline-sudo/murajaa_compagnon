import React, { useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTasksStore } from '@/stores/tasksStore';
import { TaskCard } from '@/components/TaskCard';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import { todayDateString } from '@/services/planningAlgorithm';

export default function TodayScreen() {
  const router = useRouter();
  const { todayTasks, todayCounts, loaded, loadToday, markTaskDone, markTaskSkipped } =
    useTasksStore();

  useEffect(() => {
    loadToday();
  }, []);

  const today = todayDateString();
  const dateLabel = new Date(today + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const pendingTasks = todayTasks.filter(t => t.status === 'planned' || t.status === 'backlog');
  const doneTasks = todayTasks.filter(t => t.status === 'done');
  const completion = todayTasks.length > 0
    ? Math.round((doneTasks.length / todayTasks.length) * 100)
    : 0;

  return (
    <View style={styles.container}>
      {/* Header summary */}
      <View style={styles.header}>
        <Text style={styles.dateText}>{dateLabel}</Text>
        <View style={styles.statsRow}>
          <StatPill label="À faire" value={pendingTasks.length} color={Colors.planned} />
          <StatPill label="Faits" value={doneTasks.length} color={Colors.done} />
          <StatPill label="Complété" value={`${completion}%`} color={Colors.accent} />
        </View>
        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${completion}%` }]}
          />
        </View>
      </View>

      {todayTasks.length === 0 ? (
        <EmptyState onGoToReview={() => router.push('/review')} />
      ) : (
        <FlatList
          data={todayTasks}
          keyExtractor={t => String(t.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={!loaded} onRefresh={loadToday} />
          }
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={() =>
                router.push({ pathname: '/reader/[pageId]', params: { pageId: String(item.unitId), taskId: String(item.id) } })
              }
              onMarkDone={() => markTaskDone(item.id)}
              onSkip={() => markTaskSkipped(item.id)}
            />
          )}
          ListHeaderComponent={
            pendingTasks.length > 0 ? (
              <TouchableOpacity
                style={styles.startBtn}
                onPress={() =>
                  router.push({
                    pathname: '/reader/[pageId]',
                    params: { pageId: String(pendingTasks[0].unitId), taskId: String(pendingTasks[0].id) },
                  })
                }
              >
                <Text style={styles.startBtnText}>▶ Commencer la révision</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </View>
  );
}

function StatPill({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <Text style={[styles.pillValue, { color }]}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

function EmptyState({ onGoToReview }: { onGoToReview: () => void }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>📖</Text>
      <Text style={styles.emptyTitle}>Aucune tâche aujourd'hui</Text>
      <Text style={styles.emptySubtitle}>
        Configurez votre plan de révision ou choisissez une unité à réviser.
      </Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={onGoToReview}>
        <Text style={styles.emptyBtnText}>Commencer une révision libre</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  dateText: {
    color: Colors.textInverse,
    fontSize: FontSizes.lg,
    fontWeight: '600',
    textTransform: 'capitalize',
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    flex: 1,
  },
  pillValue: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  pillLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textInverse,
    opacity: 0.8,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
  },
  list: { padding: Spacing.md },
  startBtn: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  startBtnText: {
    color: Colors.textInverse,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyEmoji: { fontSize: 60, marginBottom: Spacing.md },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  emptyBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  emptyBtnText: { color: Colors.textInverse, fontWeight: '600' },
});
