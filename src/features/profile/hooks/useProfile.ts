import { useAuthStore } from '@/features/auth/store/auth.store';
import { useApiQuery } from '@/shared/api/hooks';

import { profileApi } from '../api/profile.api';

export const PROFILE_QUERY_KEY = ['profile', 'me'] as const;
export const getProfileQueryKey = (userId?: string | null) =>
  [...PROFILE_QUERY_KEY, userId ?? 'anonymous'] as const;

/**
 * Fetches the authenticated user's profile from /users/me/profile and keeps
 * the auth store's `user` in sync. Disabled when the user isn't logged in.
 *
 * Note on avatar handling: the server's avatar_url may briefly be `null`
 * immediately after an upload (the worker writes to storage before the user
 * record). We don't overwrite a non-null local avatarUrl with a server `null`
 * — that would erase a freshly uploaded avatar. Subsequent fetches will
 * reconcile once the backend catches up.
 */
export function useProfile() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.user?.id);
  const updateUser = useAuthStore((s) => s.updateUser);

  return useApiQuery(
    getProfileQueryKey(userId) as unknown as unknown[],
    async () => {
      const profile = await profileApi.getProfile();
      const currentAvatar = useAuthStore.getState().user?.avatarUrl ?? null;
      updateUser({
        name: profile.name,
        gender: profile.gender,
        fitnessGoals: profile.fitnessGoals,
        fitnessLevel: profile.fitnessLevel,
        // Only overwrite when the server has something concrete to say.
        avatarUrl: profile.avatarUrl ?? currentAvatar,
        profileComplete: profile.profileComplete,
      });
      return profile;
    },
    { enabled: !!accessToken && !!userId, retry: 1 },
  );
}
