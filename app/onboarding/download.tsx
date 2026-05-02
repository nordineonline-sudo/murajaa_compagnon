import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { downloadQuranData, isDataReady } from '@/services/downloadManager';
import { useSettingsStore } from '@/stores/settingsStore';
import { ProgressBar } from '@/components/ProgressBar';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';

type Phase = 'idle' | 'downloading' | 'done' | 'error';

export default function OnboardingDownloadScreen() {
  const router = useRouter();
  const { setDataDownloaded } = useSettingsStore();
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  async function startDownload() {
    // Check if already downloaded
    const ready = await isDataReady();
    if (ready) {
      await setDataDownloaded('1.0.0');
      setPhase('done');
      return;
    }

    setPhase('downloading');
    setProgress(0);

    try {
      await downloadQuranData((pct) => setProgress(pct));
      await setDataDownloaded('1.0.0');
      setPhase('done');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue';
      setErrorMsg(msg);
      setPhase('error');
    }
  }

  function goNext() {
    router.push('/onboarding/selection');
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>
          {phase === 'done' ? '✅' : phase === 'error' ? '❌' : '⬇️'}
        </Text>
        <Text style={styles.title}>Données du Coran</Text>
        <Text style={styles.subtitle}>
          {phase === 'idle' &&
            "Téléchargez les données du Coran (arabe, translittération, phonétique, traduction). L'application fonctionnera entièrement hors ligne après cela."}
          {phase === 'downloading' && 'Téléchargement en cours…'}
          {phase === 'done' && 'Données téléchargées avec succès !'}
          {phase === 'error' && `Erreur : ${errorMsg}`}
        </Text>

        {(phase === 'downloading' || phase === 'done') && (
          <View style={styles.progressContainer}>
            <ProgressBar progress={progress} label="Progression" />
          </View>
        )}

        {phase === 'idle' && (
          <TouchableOpacity style={styles.btn} onPress={startDownload}>
            <Text style={styles.btnText}>Télécharger les données</Text>
          </TouchableOpacity>
        )}

        {phase === 'downloading' && (
          <View style={styles.loadingInfo}>
            <Text style={styles.loadingText}>
              {Math.round(progress * 100)}% — Veuillez patienter…
            </Text>
          </View>
        )}

        {phase === 'done' && (
          <TouchableOpacity style={styles.btn} onPress={goNext}>
            <Text style={styles.btnText}>Continuer →</Text>
          </TouchableOpacity>
        )}

        {phase === 'error' && (
          <TouchableOpacity style={[styles.btn, styles.btnRetry]} onPress={startDownload}>
            <Text style={styles.btnText}>🔄 Réessayer</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => router.push('/onboarding/selection')}
        >
          <Text style={styles.skipText}>Ignorer pour l'instant</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emoji: { fontSize: 72, marginBottom: Spacing.lg },
  title: {
    fontSize: 24,
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
  progressContainer: { width: '100%', marginBottom: Spacing.lg },
  btn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    minWidth: 200,
    alignItems: 'center',
  },
  btnRetry: { backgroundColor: Colors.warning },
  btnText: { color: Colors.textInverse, fontSize: FontSizes.lg, fontWeight: '700' },
  loadingInfo: { marginBottom: Spacing.md },
  loadingText: { color: Colors.textSecondary, fontSize: FontSizes.md },
  skipBtn: { marginTop: Spacing.md },
  skipText: { color: Colors.textLight, fontSize: FontSizes.sm, textDecorationLine: 'underline' },
});
