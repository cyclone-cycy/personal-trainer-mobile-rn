import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { EntryScreen } from '@/features/entry';
import { useNotificationsSocket, usePushNotifications } from '@/features/notifications';
import { useOnboardingStore } from '@/features/onboarding/store/onboarding.store';
import { AppProviders } from '@/providers/AppProviders';
import { useAppReady } from '@/shared/hooks/useAppReady';
import { useDeepLinkAuthRedirect } from '@/shared/hooks/useDeepLinkAuthRedirect';
import { useTheme } from '@/shared/theme';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isReady } = useAppReady();
  const { colors } = useTheme();
  const { isLoggedIn } = useAuthSession();
  const hasCompleted = useOnboardingStore((s) => s.hasCompleted);
  const resetOnboarding = useOnboardingStore((s) => s.resetOnboarding);
  const showWelcome = useAuthStore((s) => s.showWelcome);
  const [entryDone, setEntryDone] = useState(false);
  const didResetOnboardingForLaunch = useRef(false);
  useNotificationsSocket(isLoggedIn);

  // Replay auth-gated deep links (e.g. the emailed reschedule link) once the
  // (main) stack is mounted — which is `isLoggedIn && !showWelcome` below.
  useDeepLinkAuthRedirect(isLoggedIn && !showWelcome);

  // Initialize and run push notifications globally
  usePushNotifications();

  // Hide splash only AFTER React has painted the navigation tree.
  // useEffect fires post-render/paint, so the correct screen is visible
  // underneath before the splash fades — no blank flash.
  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  useEffect(() => {
    if (!isReady || didResetOnboardingForLaunch.current) return;

    didResetOnboardingForLaunch.current = true;
    resetOnboarding();
  }, [isReady, resetOnboarding]);

  const handleEntryComplete = useCallback(() => setEntryDone(true), []);

  if (!isReady) return null;

  if (!entryDone) {
    return <EntryScreen onComplete={handleEntryComplete} />;
  }

  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    >
      {!hasCompleted && <Stack.Screen name="(onboarding)" options={{ animation: 'fade' }} />}
      {hasCompleted && !isLoggedIn && (
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
      )}
      {isLoggedIn && showWelcome && <Stack.Screen name="welcome" options={{ animation: 'fade' }} />}
      {isLoggedIn && !showWelcome && (
        <Stack.Screen name="profile-setup" options={{ animation: 'fade' }} />
      )}
      {isLoggedIn && !showWelcome && (
        <Stack.Screen name="profile-setup-video" options={{ animation: 'slide_from_bottom' }} />
      )}
      {isLoggedIn && !showWelcome && <Stack.Screen name="(main)" options={{ animation: 'fade' }} />}
      <Stack.Screen name="privacy-policy" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="terms-of-service" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootLayoutNav />
    </AppProviders>
  );
}
