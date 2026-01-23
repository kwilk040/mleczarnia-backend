import { API_BASE_URL } from '../config';
import * as authApi from './auth';

// Helper do pobierania access token z localStorage
export function getAccessToken(): string | null {
  try {
    const tokens = localStorage.getItem('auth_tokens');
    if (!tokens) return null;
    const parsed = JSON.parse(tokens);
    return parsed.accessToken || null;
  } catch {
    return null;
  }
}

// Helper do pobierania refresh token z localStorage
export function getRefreshToken(): string | null {
  try {
    const tokens = localStorage.getItem('auth_tokens');
    if (!tokens) return null;
    const parsed = JSON.parse(tokens);
    return parsed.refreshToken || null;
  } catch {
    return null;
  }
}

// Helper do zapisywania tokenów
export function saveTokens(tokens: authApi.TokenResponse): void {
  localStorage.setItem('auth_tokens', JSON.stringify(tokens));
}

// Helper do odświeżania tokenu
let isRefreshing = false;
let refreshPromise: Promise<authApi.TokenResponse> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (isRefreshing && refreshPromise) {
    const tokens = await refreshPromise;
    return tokens.accessToken;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const newTokens = await authApi.refreshToken(refreshToken);
      saveTokens(newTokens);
      return newTokens;
    } catch (error) {
      // Jeśli refresh się nie powiódł, wyczyść tokeny i przekieruj do logowania
      localStorage.removeItem('auth_tokens');
      localStorage.removeItem('auth_user');
      throw error;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  const tokens = await refreshPromise;
  return tokens.accessToken;
}

// Helper do tworzenia requestów z autoryzacją i automatycznym odświeżaniem tokenu
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let token = getAccessToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
  let response = await fetch(url, {
    ...options,
    headers,
  });

  // Jeśli dostaliśmy 401 (Unauthorized), spróbuj odświeżyć token
  if (response.status === 401 && token) {
    try {
      token = await refreshAccessToken();
      headers['Authorization'] = `Bearer ${token}`;
      
      // Ponów request z nowym tokenem
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (refreshError) {
      // Jeśli odświeżanie się nie powiodło, przekieruj do logowania
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw refreshError;
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  // Jeśli response jest pusty (np. 204 No Content)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return {} as T;
  }

  return (await response.json()) as T;
}
