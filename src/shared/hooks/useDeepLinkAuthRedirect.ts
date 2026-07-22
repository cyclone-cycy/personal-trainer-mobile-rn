import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useAuthStore } from '@/features/auth/store/auth.store';

// Deep links into authenticated areas (e.g. the reschedule link emailed to a
// client: https://fitcall.me/session/<id>/reschedule) must survive login. When
// the app opens on such a link while logged in, expo-router routes to it
// natively. While logged OUT, the target (main) stack isn't mounted, so we stash
// the path and replay it once the session is established.

/** Paths that require an authenticated session. */
function isProtectedPath(path: string): boolean {
  return path.startsWith('/session') || path.startsWith('/(main)');
}

function extractPath(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const { path } = Linking.parse(url);
    if (!path) return null;
    return '/' + path.replace(/^\/+/, '');
  } catch {
    return null;
  }
}

export function useDeepLinkAuthRedirect(isLoggedIn: boolean) {
  const pending = useRef<string | null>(null);

  // Capture the incoming URL (cold start + while running). Only stash it when
  // logged out; when logged in expo-router handles routing itself, so we don't
  // navigate here and risk a double navigation.
  useEffect(() => {
    let active = true;
    const capture = (url: string | null | undefined) => {
      if (!active) return;
      const path = extractPath(url);
      if (!path || !isProtectedPath(path)) return;
      if (!useAuthStore.getState().accessToken) {
        pending.current = path;
      }
    };

    Linking.getInitialURL().then(capture);
    const sub = Linking.addEventListener('url', ({ url }) => capture(url));
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  // Replay the stashed link once the user is authenticated. Defer a tick so the
  // (main) stack has mounted before we navigate into it.
  useEffect(() => {
    if (!isLoggedIn || !pending.current) return;
    const target = pending.current;
    pending.current = null;
    const timer = setTimeout(() => router.replace(target as never), 0);
    return () => clearTimeout(timer);
  }, [isLoggedIn]);
}
