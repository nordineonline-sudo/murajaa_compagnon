import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { getDatabase } from '@/db/database';
import { runMigrations } from '@/db/schema';
import { useSettingsStore } from '@/stores/settingsStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const { loadSettings, settings } = useSettingsStore();
  const router = useRouter();

  useEffect(() => {
    async function init() {
      try {
        const db = await getDatabase();
        await runMigrations(db);
        await loadSettings();
      } finally {
        setReady(true);
        await SplashScreen.hideAsync();
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!settings.onboardingComplete) {
      router.replace('/onboarding/display');
    }
  }, [ready, settings.onboardingComplete]);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/display" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/selection" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/plan-setup" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
