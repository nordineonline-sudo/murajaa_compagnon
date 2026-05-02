import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';

export default function OnboardingDisplayScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heroEmoji}>📋</Text>
        <Text style={styles.title}>Murajaa Compagnon</Text>
        <Text style={styles.subtitle}>
          Votre gestionnaire de tâches de révision du Coran.
        </Text>

        <View style={styles.featureList}>
          <FeatureItem icon="✅" text="Planifiez vos révisions sur la durée de votre choix" />
          <FeatureItem icon="📅" text="Recevez vos tâches du jour chaque matin" />
          <FeatureItem icon="📊" text="Suivez votre progression avec des statistiques" />
          <FeatureItem icon="🔔" text="Rappels quotidiens personnalisables" />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => router.push('/onboarding/selection')}
        >
          <Text style={styles.nextBtnText}>Commencer →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  heroEmoji: { fontSize: 72, marginBottom: Spacing.lg, textAlign: 'center' },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  featureList: { width: '100%', gap: Spacing.md },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  featureIcon: { fontSize: 22, width: 30, textAlign: 'center' },
  featureText: { flex: 1, fontSize: FontSizes.md, color: Colors.text, lineHeight: 22 },
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
