import { create, isAxiosError } from 'axios';

import { getJwtType, hasJwtExp } from '@/shared/api/jwt';
import { ApiError } from '@/shared/api/types';
import { env } from '@/shared/constants/env';

import { deactivatedFromUser } from '../lib/deactivation';

import type { ApiEnvelope, AuthResponse, AuthTokens, RawAuthData } from './auth.types';

const authClient = create({
  baseURL: env.API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

function unwrap(data: RawAuthData): AuthResponse {
  return {
    user: {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      userType: data.user.user_type,
      profileComplete: data.user.profile_complete,
      isActive: !deactivatedFromUser(data.user),
      gender: data.user.gender ?? null,
      fitnessGoals: data.user.fitness_goals ?? null,
      fitnessLevel: data.user.fitness_level ?? null,
      avatarUrl: data.user.avatar_url ?? null,
    },
    tokens: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    },
    isNewUser: data.is_new_user,
    expiresIn: data.expires_in,
  };
}

async function googleAuth(idToken: string): Promise<AuthResponse> {
  const res = await authClient.post<ApiEnvelope<RawAuthData>>('/auth/google/mobile', {
    id_token: idToken,
  });
  return unwrap(res.data.data);
}

// Apple returns the user's name only on the FIRST authorization, so we forward
// it when present; the identity token (a JWT) is what the backend verifies.
async function appleAuth(payload: {
  identityToken: string;
  fullName?: string | null;
}): Promise<AuthResponse> {
  try {
    const res = await authClient.post<ApiEnvelope<RawAuthData>>('/auth/apple', {
      id_token: payload?.identityToken,
      ...(payload?.fullName
        ? {
            user: {
              name: payload?.fullName,
            },
          }
        : {}),
    });
    return unwrap(res.data.data);
  } catch (error) {
    throw toApiError(error);
  }
}

async function refreshTokens(refreshToken: string, accessToken: string): Promise<AuthTokens> {
  try {
    const response = await fetch(`${env.API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshToken}`,
      },
      body: JSON.stringify({ access_token: accessToken }),
    });

    const parsed = (await response.json()) as ApiEnvelope<{
      access_token: string;
      refresh_token?: string;
    }> & { message?: string; code?: string };

    if (!response.ok) {
      throw new ApiError(parsed.message ?? 'Token refresh failed', response.status, parsed.code);
    }

    if (!hasJwtExp(parsed.data.access_token)) {
      throw new ApiError(
        'Invalid access token returned from refresh',
        response.status,
        parsed.code,
      );
    }

    // If the server rotated the refresh token, hold it to the same contract
    // the rest of the app applies on cold start (must be a JWT with `exp` and
    // type === "refresh"). Storing a malformed token would log the user out
    // on the next 401 or cold start.
    const rotated = parsed.data.refresh_token;
    if (rotated !== undefined) {
      if (!hasJwtExp(rotated) || getJwtType(rotated) !== 'refresh') {
        throw new ApiError(
          'Invalid refresh token returned from refresh',
          response.status,
          parsed.code,
        );
      }
    }

    return {
      accessToken: parsed.data.access_token,
      refreshToken: rotated ?? refreshToken,
    };
  } catch (error) {
    throw toApiError(error);
  }
}

async function logout(refreshToken: string, accessToken?: string | null): Promise<void> {
  // Skip the refresh-on-401 interceptor for this call. The server may invalidate
  // the refresh token immediately, which would cause the auto-retry to fail with
  // "invalid token". Logout is best-effort — let the caller handle a non-2xx.
  await authClient.post(
    '/auth/logout',
    { refresh_token: refreshToken },
    {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    },
  );
}

export const authApi = { googleAuth, appleAuth, refreshTokens, logout };

function toApiError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string; code?: string } | undefined;
    return new ApiError(data?.message ?? error.message, error.response?.status ?? 0, data?.code);
  }

  if (error instanceof ApiError) {
    return error;
  }

  return new ApiError('Unknown error', 0);
}
