import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Switch, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTasksStore } from '@/stores/tasksStore';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  scheduleDailyReminders,
  requestNotificationPermission,
} from '@/services/notificationService';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import { todayDateString } from '@/services/planningAlgorithm';
import type { BacklogStrategy, ReviewUnit } from '@/types';
import type { PlanUnit } from '@/services/planningAlgorithm';

export default function PlanSetupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ selections?: string }>();
  const { createPlan } = useTasksStore();
  const { settings, updatePlanning, setOnboardingComplete } = useSettingsStore();

  const selections: PlanUnit[] = params.selections
    ? (JSON.parse(params.selections) as PlanUnit[])
    : [];

  const [nbDays, setNbDays] = useState(String(settings.planning.planDurationDays));
  const [qty, setQty] = useState(String(settings.planning.quantityPerDay));
  const [startDate, setStartDate] = useState(todayDateString());
  const [backlog, setBacklog] = useState<BacklogStrategy>(settings.planning.backlogStrategy);
  const [notifHours, setNotifHours] = useState<number[]>(settings.planning.notificationHours);
  const [creating, setCreating] = useState(false);

  const PRESET_HOURS = [6, 7, 8, 12, 18, 20, 21, 22];

  function toggleHour(h: number) {
    setNotifHours(prev =>
      prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h].sort((a, b) => a - b)
    );
  }

  async function handleCreate() {
    const days = parseInt(nbDays, 10);
    const quantity = parseInt(qty, 10);

    if (isNaN(days) || days < 1 || days > 365) {
      Alert.alert('Durée invalide', 'Entrez un nombre de jours entre 1 et 365.');
      return;
    }
    if (isNaN(quantity) || quantity < 1 || quantity > 50) {
      Alert.alert('Quantité invalide', 'Entrez une quantité entre 1 et 50.');
      return;
    }
    if (selections.length === 0) {
      Alert.alert('Aucune sélection', 'Retournez à l\'écran précédent et sélectionnez des unités.');
      return;
    }

    setCreating(true);
    try {
      await updatePlanning({
        reviewUnit: selections[0]?.unitType ?? 'page',
        quantityPerDay: quantity,
        planDurationDays: days,
        startDate,
        notificationHours: notifHours,
        backlogStrategy: backlog,
      });

      await createPlan(selections, {
        startDate,
        nbDays: days,
        reviewUnit: selections[0]?.unitType ?? 'page',
        quantityPerDay: quantity,
        backlogStrategy: backlog,
      });

      // Schedule notifications
      if (notifHours.length > 0) {
        const granted = await requestNotificationPermission();
        if (granted) {
          await scheduleDailyReminders(notifHours);
        }
      }

      await setOnboardingComplete(true);
      router.replace('/(tabs)/today');
    } catch (e) {
      Alert.alert('Erreur', String(e));
    } finally {
      setCreating(false);
    }
  }

  const totalUnits = selections.length;
  const estimatedDays = Math.ceil(totalUnits / Math.max(1, parseInt(qty, 10) || 1));

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Configurer votre plan</Text>
        <Text style={styles.subtitle}>
          {totalUnits} unités sélectionnées.
        </Text>

        {/* Duration */}
        <FormGroup label="Durée du plan (jours)">
          <TextInput
            style={styles.input}
            value={nbDays}
            onChangeText={setNbDays}
            keyboardType="number-pad"
            maxLength={3}
            placeholder="30"
          />
          <Text style={styles.hint}>
            Estimation : {estimatedDays} jour{estimatedDays !== 1 ? 's' : ''} pour tout couvrir à {qty} unité{parseInt(qty, 10) !== 1 ? 's' : ''}/jour.
          </Text>
        </FormGroup>

        {/* Quantity */}
        <FormGroup label={`Quantité par jour (${selections[0]?.unitType ?? 'unités'})`}>
          <TextInput
            style={styles.input}
            value={qty}
            onChangeText={setQty}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="1"
          />
        </FormGroup>

        {/* Backlog strategy */}
        <FormGroup label="Gestion des jours manqués">
          <View style={styles.optionRow}>
            <TouchableOpacity
              style={[styles.option, backlog === 'postpone' && styles.optionActive]}
              onPress={() => setBacklog('postpone')}
            >
              <Text style={[styles.optionText, backlog === 'postpone' && styles.optionTextActive]}>
                Reporter au lendemain
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.option, backlog === 'spread' && styles.optionActive]}
              onPress={() => setBacklog('spread')}
            >
              <Text style={[styles.optionText, backlog === 'spread' && styles.optionTextActive]}>
                Répartir sur les jours restants
              </Text>
            </TouchableOpacity>
          </View>
        </FormGroup>

        {/* Notifications */}
        <FormGroup label="Rappels quotidiens">
          <View style={styles.hoursGrid}>
            {PRESET_HOURS.map(h => (
              <TouchableOpacity
                key={h}
                style={[styles.hourChip, notifHours.includes(h) && styles.hourChipActive]}
                onPress={() => toggleHour(h)}
              >
                <Text style={[styles.hourText, notifHours.includes(h) && styles.hourTextActive]}>
                  {String(h).padStart(2, '0')}:00
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </FormGroup>

        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Résumé</Text>
          <SummaryRow label="Unités" value={String(totalUnits)} />
          <SummaryRow label="Durée" value={`${nbDays} jours`} />
          <SummaryRow label="Quantité/jour" value={qty} />
          <SummaryRow label="Début" value={startDate} />
          <SummaryRow label="Rappels" value={notifHours.length > 0 ? notifHours.map(h => `${h}h`).join(', ') : 'Aucun'} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createBtn, creating && styles.createBtnDisabled]}
          onPress={handleCreate}
          disabled={creating}
        >
          <Text style={styles.createBtnText}>
            {creating ? 'Création en cours…' : '🚀 Lancer mon plan'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FormGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.formLabel}>{label}</Text>
      {children}
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  title: { fontSize: 24, fontWeight: '800', color: Colors.primary, marginBottom: Spacing.xs },
  subtitle: { fontSize: FontSizes.md, color: Colors.textSecondary, marginBottom: Spacing.lg },
  formGroup: { marginBottom: Spacing.lg },
  formLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontSize: FontSizes.lg,
    color: Colors.text,
  },
  hint: { fontSize: FontSizes.sm, color: Colors.textLight, marginTop: 4 },
  optionRow: { flexDirection: 'row', gap: Spacing.sm },
  option: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  optionActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  optionText: { fontSize: FontSizes.sm, color: Colors.textSecondary, textAlign: 'center' },
  optionTextActive: { color: Colors.primary, fontWeight: '700' },
  hoursGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  hourChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  hourChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  hourText: { color: Colors.textSecondary, fontSize: FontSizes.sm },
  hourTextActive: { color: Colors.textInverse },
  summary: {
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    marginBottom: Spacing.xl,
  },
  summaryTitle: { fontWeight: '700', color: Colors.primary, marginBottom: Spacing.sm },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryLabel: { color: Colors.textSecondary, fontSize: FontSizes.sm },
  summaryValue: { color: Colors.text, fontSize: FontSizes.sm, fontWeight: '600' },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  createBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  createBtnDisabled: { backgroundColor: Colors.textLight },
  createBtnText: { color: Colors.textInverse, fontSize: FontSizes.lg, fontWeight: '700' },
});
