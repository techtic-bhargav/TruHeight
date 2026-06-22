import { useUserStore } from '@/store';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

export default function Index() {
  const [hasRehydrated, setHasRehydrated] = useState(false);
  const user = useUserStore((s) => s.user);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);

  useEffect(() => {
    const unsub = useUserStore.persist.onFinishHydration(() => {
      setHasRehydrated(true);
    });
    if (useUserStore.persist.hasHydrated()) {
      setHasRehydrated(true);
    }
    return unsub;
  }, []);

  if (!hasRehydrated) {
    return null;
  }

  const hasToken = !!(user?.token ?? user?.access_token);
  const isOnboardingComplete = user?.is_onboarding_complete ?? false;

  if (isAuthenticated && hasToken && isOnboardingComplete) {
    return <Redirect href="/(tabs)" />;
  }
  if (hasToken && isOnboardingComplete) {
    return <Redirect href="/(tabs)" />;
  }
  // Logged in but profile/onboarding not complete: show login on app reopen (e.g. after kill)
  if (isAuthenticated && hasToken && !isOnboardingComplete) {
    return <Redirect href="/login" />;
  }
  return <Redirect href="/onboarding" />;
}
