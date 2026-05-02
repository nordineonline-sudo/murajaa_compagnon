import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, Switch, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '@/stores/settingsStore';
import { scheduleDailyReminders, cancelAllReminders } from '@/services/notificationService';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateDisplay, updatePlanning, setOnboardingComplete } = useSettingsStore();
  const { display, planning } = settings;

  async function toggleHour(hour: number) {
    const current = planning.notificationHours;
    const next = current.includes(hour)
      ? current.filter(h => h !== hour)
      : [...current, hour].sort((a, b) => a - b);
    await updatePlanning({ notificationHours: next });
    if (next.length > 0) {
      await scheduleDailyReminders(next);
    } else {
      await cancelAllReminders();
    }
  }

  async function resetOnboarding() {
    Alert.alert(
      'Réinitialiser',
      'Cela supprimera votre plan actuel et relancera l\'assistant de configuration.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async () => {
            await setOnboardingComplete(false);
            router.replace('/onboarding/display');
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Display section */}
      <SectionTitle title="Affichage" />
      <View style={styles.card}>
        <SettingRow
          label="Arabe"
          value={display.showArabic}
          onToggle={v => updateDisplay({ showArabic: v })}
        />
        <Divider />
        <SettingRow
          label="Translittération"
          value={display.showTransliteration}
          onToggle={v => updateDisplay({ showTransliteration: v })}
        />
        <Divider />
        <SettingRow
          label="Phonétique (française)"
          value={display.showPhonetic}
          onToggle={v => updateDisplay({ showPhonetic: v })}
        />
        <Divider />
        <SettingRow
          label="Traduction française"
          value={display.showTranslation}
          onToggle={v => updateDisplay({ showTranslation: v })}
        />
      </View>

      {/* Notifications */}
      <SectionTitle title="Rappels quotidiens" />
      <View style={styles.card}>
        <Text style={styles.subText}>Heure(s) de rappel :</Text>
        <View style={styles.hoursRow}>
          {[6, 7, 8, 12, 18, 20, 21, 22].map(h => (
            <TouchableOpacity
              key={h}
              style={[
                styles.hourChip,
                planning.notificationHours.includes(h) && styles.hourChipActive,
              ]}
              onPress={() => toggleHour(h)}
            >
              <Text
                style={[
                  styles.hourText,
                  planning.notificationHours.includes(h) && styles.hourTextActive,
                ]}
              >
                {String(h).padStart(2, '0')}h
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Planning */}
      <SectionTitle title="Plan de révision" />
      <View style={styles.card}>
        <InfoRow label="Unité" value={planning.reviewUnit} />
        <Divider />
        <InfoRow label="Quantité/jour" value={String(planning.quantityPerDay)} />
        <Divider />
        <InfoRow label="Durée" value={`${planning.planDurationDays} jours`} />
        <Divider />
        <InfoRow label="Début" value={planning.startDate} />
        <Divider />
        <InfoRow label="Gestion backlog" value={planning.backlogStrategy === 'postpone' ? 'Reporter' : 'Réétaler'} />
        <Divider />
        <TouchableOpacity
          style={styles.planBtn}
          onPress={() => router.push('/onboarding/plan-setup')}
        >
          <Text style={styles.planBtnText}>Modifier le plan →</Text>
        </TouchableOpacity>
      </View>

      {/* Data */}
      <SectionTitle title="Données" />
      <View style={styles.card}>
        <InfoRow label="Version données" value={settings.dataVersion || 'Non téléchargé'} />
        <Divider />
        <TouchableOpacity
          style={styles.dangerBtn}
          onPress={resetOnboarding}
        >
          <Text style={styles.dangerBtnText}>🔄 Reconfigurer l'application</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Text style={styles.sectionTitle}>{title}</Text>
  );
}

function SettingRow({
  label, value, onToggle,
}: { label: string; value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ true: Colors.primary }}
        thumbColor={Colors.surface}
      />
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md },
  sectionTitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  rowLabel: { fontSize: FontSizes.md, color: Colors.text },
  rowValue: { fontSize: FontSizes.md, color: Colors.textSecondary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginLeft: Spacing.md },
  subText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    padding: Spacing.md,
    paddingBottom: 0,
  },
  hoursRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  hourChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  hourChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  hourText: { color: Colors.textSecondary, fontSize: FontSizes.sm },
  hourTextActive: { color: Colors.textInverse },
  planBtn: { padding: Spacing.md, alignItems: 'center' },
  planBtnText: { color: Colors.primary, fontWeight: '600', fontSize: FontSizes.md },
  dangerBtn: { padding: Spacing.md, alignItems: 'center' },
  dangerBtnText: { color: Colors.error, fontWeight: '600', fontSize: FontSizes.md },
});
