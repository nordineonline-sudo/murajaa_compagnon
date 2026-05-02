import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import { useTasksStore } from '@/stores/tasksStore';

export default function CompletionScreen() {
  const { pageId, taskId } = useLocalSearchParams<{ pageId?: string; taskId?: string }>();
  const router = useRouter();
  const { todayTasks, todayCounts } = useTasksStore();

  const remainingTasks = todayTasks.filter(
    t => (t.status === 'planned' || t.status === 'backlog') && String(t.id) !== taskId
  );
  const nextTask = remainingTasks[0];

  const allDone = todayCounts.done >= todayCounts.planned && todayCounts.planned > 0;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>{allDone ? '🏆' : '✅'}</Text>
        <Text style={styles.title}>
          {allDone ? 'Toutes les tâches du jour accomplies !' : 'Tâche complétée !'}
        </Text>
        <Text style={styles.subtitle}>
          Page {pageId} révisée avec succès.
        </Text>

        {!allDone && (
          <View style={styles.stats}>
            <StatItem
              label="Faites"
              value={String(todayCounts.done)}
              color={Colors.done}
            />
            <StatItem
              label="Restantes"
              value={String(remainingTasks.length)}
              color={Colors.planned}
            />
          </View>
        )}

        {allDone && (
          <View style={styles.achievement}>
            <Text style={styles.achievementText}>
              🎉 Félicitations ! Vous avez complété toutes vos révisions du jour.{'\n'}
              Revenez demain pour la prochaine session.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {nextTask && !allDone && (
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={() =>
              router.replace({
                pathname: '/reader/[pageId]',
                params: { pageId: String(nextTask.unitId), taskId: String(nextTask.id) },
              })
            }
          >
            <Text style={styles.nextBtnText}>
              ▶ Tâche suivante : {nextTask.label}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => router.replace('/(tabs)/today')}
        >
          <Text style={styles.homeBtnText}>
            {allDone ? '🏠 Retour à l\'accueil' : 'Retour au tableau de bord'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StatItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.statItem, { borderColor: color }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary, justifyContent: 'space-between' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emoji: { fontSize: 80, marginBottom: Spacing.lg },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textInverse,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.lg,
    color: Colors.textInverse,
    opacity: 0.85,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    minWidth: 80,
  },
  statValue: { fontSize: 32, fontWeight: '700', color: Colors.textInverse },
  statLabel: { fontSize: FontSizes.sm, color: Colors.textInverse, opacity: 0.8 },
  achievement: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    maxWidth: 320,
  },
  achievementText: {
    color: Colors.textInverse,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: FontSizes.md,
  },
  actions: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  nextBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  nextBtnText: { color: Colors.textInverse, fontWeight: '700', fontSize: FontSizes.md },
  homeBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  homeBtnText: { color: Colors.textInverse, fontWeight: '600', fontSize: FontSizes.md },
});
