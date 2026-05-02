import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import { useSettingsStore } from '@/stores/settingsStore';

const UNIT_PRESETS = [
  { label: 'Page' },
  { label: 'Sourate' },
  { label: 'Juz' },
  { label: 'Hizb' },
];

export default function OnboardingSelectionScreen() {
  const router = useRouter();
  const { updatePlanning } = useSettingsStore();
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [totalUnits, setTotalUnits] = useState('604');

  const preset = UNIT_PRESETS[selectedPreset];
  const count = parseInt(totalUnits, 10);
  const isValid = !isNaN(count) && count >= 1 && count <= 10000;

  function goNext() {
    if (!isValid) return;
    const units = Array.from({ length: count }, (_, i) => ({
      unitType: 'page',
      unitId: i + 1,
      label: `${preset.label} ${i + 1}`,
    }));

    updatePlanning({ reviewUnit: 'page' });

    router.push({
      pathname: '/onboarding/plan-setup',
      params: { selections: JSON.stringify(units) },
    });
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Configurez votre contenu</Text>
        <Text style={styles.subtitle}>
          Choisissez le type d'unité et le nombre total à réviser.
        </Text>

        <Text style={styles.sectionLabel}>Type d'unité :</Text>
        <View style={styles.presetsRow}>
          {UNIT_PRESETS.map((p, i) => (
            <TouchableOpacity
              key={p.label}
              style={[styles.presetChip, selectedPreset === i && styles.presetChipActive]}
              onPress={() => setSelectedPreset(i)}
            >
              <Text style={[styles.presetText, selectedPreset === i && styles.presetTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Nombre total d'unités :</Text>
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            value={totalUnits}
            onChangeText={setTotalUnits}
            keyboardType="number-pad"
            placeholder="ex: 604"
            placeholderTextColor={Colors.textLight}
            maxLength={5}
          />
          <Text style={styles.inputHint}>
            Les tâches seront nommées : {preset.label} 1, {preset.label} 2…
          </Text>
        </View>

        {isValid && (
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              📋 {count} unités seront créées
            </Text>
            <Text style={styles.summaryExample}>
              ex: « {preset.label} 1 », « {preset.label} {Math.min(count, 3)} »…
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, !isValid && styles.nextBtnDisabled]}
          onPress={goNext}
          disabled={!isValid}
        >
          <Text style={styles.nextBtnText}>
            Continuer {isValid ? `(${count} unités)` : ''} →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  sectionLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  presetChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  presetChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  presetText: { fontSize: FontSizes.md, color: Colors.text },
  presetTextActive: { color: Colors.textInverse, fontWeight: '700' },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  inputHint: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  summary: {
    backgroundColor: Colors.primary + '12',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  summaryText: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.primary },
  summaryExample: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 4 },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  nextBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  nextBtnDisabled: { backgroundColor: Colors.textLight },
  nextBtnText: { color: Colors.textInverse, fontSize: FontSizes.lg, fontWeight: '700' },
});
