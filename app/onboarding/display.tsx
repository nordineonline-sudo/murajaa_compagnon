import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, Switch, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '@/stores/settingsStore';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';

export default function OnboardingDisplayScreen() {
  const router = useRouter();
  const { settings, updateDisplay } = useSettingsStore();
  const { display } = settings;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>📖</Text>
          <Text style={styles.title}>Murajaa Compagnon</Text>
          <Text style={styles.subtitle}>
            Votre compagnon pour mémoriser et réviser le Coran.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Choisissez ce que vous souhaitez afficher :</Text>

        <View style={styles.card}>
          <DisplayRow
            label="Arabe"
            description="Texte arabe du Coran"
            value={display.showArabic}
            onToggle={v => updateDisplay({ showArabic: v })}
          />
          <Divider />
          <DisplayRow
            label="Translittération"
            description="Écriture phonétique latine standard"
            value={display.showTransliteration}
            onToggle={v => updateDisplay({ showTransliteration: v })}
          />
          <Divider />
          <DisplayRow
            label="Phonétique (fr)"
            description="Prononciation francisée"
            value={display.showPhonetic}
            onToggle={v => updateDisplay({ showPhonetic: v })}
          />
          <Divider />
          <DisplayRow
            label="Traduction française"
            description="Sens des versets en français"
            value={display.showTranslation}
            onToggle={v => updateDisplay({ showTranslation: v })}
          />
        </View>

        {/* Preview */}
        <Text style={styles.sectionTitle}>Aperçu :</Text>
        <View style={styles.preview}>
          {display.showArabic && (
            <Text style={styles.previewArabic}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
          )}
          {display.showTransliteration && (
            <Text style={styles.previewTranslit}>Bismi llāhi r-raḥmāni r-raḥīm</Text>
          )}
          {display.showPhonetic && (
            <Text style={styles.previewPhonetic}>Bismi llahi rrahmani rrahim</Text>
          )}
          {display.showTranslation && (
            <Text style={styles.previewTranslation}>
              Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux.
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => router.push('/onboarding/download')}
        >
          <Text style={styles.nextBtnText}>Suivant →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DisplayRow({
  label, description, value, onToggle,
}: { label: string; description: string; value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ true: Colors.primary }}
        thumbColor={Colors.surface}
      />
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  hero: { alignItems: 'center', marginBottom: Spacing.xl },
  heroEmoji: { fontSize: 64, marginBottom: Spacing.md },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  rowText: { flex: 1, marginRight: Spacing.md },
  rowLabel: { fontSize: FontSizes.md, color: Colors.text, fontWeight: '500' },
  rowDesc: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginLeft: Spacing.md },
  preview: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  previewArabic: {
    fontSize: 26,
    textAlign: 'right',
    color: Colors.arabic,
    lineHeight: 44,
    fontFamily: 'System',
  },
  previewTranslit: { fontSize: 14, color: Colors.textSecondary, fontStyle: 'italic', marginTop: 4 },
  previewPhonetic: { fontSize: 14, color: Colors.primaryLight, marginTop: 2 },
  previewTranslation: { fontSize: 14, color: Colors.text, marginTop: Spacing.sm, lineHeight: 20 },
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
  nextBtnText: { color: Colors.textInverse, fontSize: FontSizes.lg, fontWeight: '700' },
});
