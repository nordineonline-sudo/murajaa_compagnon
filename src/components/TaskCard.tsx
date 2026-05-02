import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import type { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
  onMarkDone?: () => void;
  onSkip?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  planned: Colors.planned,
  done: Colors.done,
  skipped: Colors.skipped,
  backlog: Colors.backlog,
};

const STATUS_LABELS: Record<string, string> = {
  planned: 'À faire',
  done: '✓ Fait',
  skipped: 'Ignoré',
  backlog: 'Reporté',
};

export function TaskCard({ task, onPress, onMarkDone, onSkip }: TaskCardProps) {
  const statusColor = STATUS_COLORS[task.status] ?? Colors.textLight;
  const isDone = task.status === 'done';

  return (
    <TouchableOpacity
      style={[styles.card, isDone && styles.cardDone]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isDone}
    >
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: statusColor }]}>
          <Text style={styles.badgeText}>{STATUS_LABELS[task.status]}</Text>
        </View>
        <Text style={styles.unitType}>{task.unitType.toUpperCase()}</Text>
      </View>

      <Text style={styles.label} numberOfLines={2}>{task.label}</Text>

      {!isDone && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, styles.btnDone]}
            onPress={onMarkDone}
          >
            <Text style={styles.btnText}>✓ Fait</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnSkip]}
            onPress={onSkip}
          >
            <Text style={[styles.btnText, { color: Colors.textSecondary }]}>Ignorer</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: Colors.planned,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  cardDone: {
    borderLeftColor: Colors.done,
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    color: Colors.textInverse,
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  unitType: {
    fontSize: FontSizes.xs,
    color: Colors.textLight,
    fontWeight: '500',
  },
  label: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  btn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  btnDone: {
    backgroundColor: Colors.done,
  },
  btnSkip: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnText: {
    color: Colors.textInverse,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
});
