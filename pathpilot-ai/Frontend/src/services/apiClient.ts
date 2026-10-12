/**
 * apiClient.ts — Authenticated HTTP client for PathPilot AI backend.
 *
 * Retrieves the Supabase session and attaches the access token to every
 * protected request. Handles 401/session-expiry gracefully.
 *
 * Base URL is read from VITE_API_URL env var (falls back to localhost:8000).
 */

import { supabase } from './supabaseClient';

const BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000';

// ── Error types ───────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly detail?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ── Token helper ──────────────────────────────────────────────────────────────

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
  requiresAuth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (requiresAuth) {
    const token = await getAccessToken();
    if (!token) {
      throw new ApiError(401, 'Not authenticated. Please sign in.');
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 204) return undefined as unknown as T;

  let body: Record<string, unknown> = {};
  try {
    body = await res.json();
  } catch {
    // Non-JSON response
  }

  if (!res.ok) {
    const message =
      (body['error'] as string) ||
      (body['detail'] as string) ||
      `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message);
  }

  return body as T;
}

// ── Typed API methods ─────────────────────────────────────────────────────────

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'GET' });
  },

  post<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  patch<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  delete(path: string): Promise<void> {
    return request<void>(path, { method: 'DELETE' });
  },

  /** Health check — no auth required */
  healthGet<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'GET' }, false);
  },
};
