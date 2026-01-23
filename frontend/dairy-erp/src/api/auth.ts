import { API_BASE_URL } from '../config';

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterCompanyPayload {
  name: string;
  taxId: string;
  mainEmail: string;
  phoneNumber?: string;
  address: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  user: {
    email: string;
    password: string;
  };
}

export async function login(request: LoginRequest): Promise<TokenResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: request.email,
      password: request.password,
    }),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  return (await response.json()) as TokenResponse;
}

export interface MeProfileResponse {
  email: string;
  role: string;
  lastLoginAt?: string | null;
  customerCompanyId?: number | null;
  employeeId?: number | null;
}

export async function getProfile(accessToken: string): Promise<MeProfileResponse> {
  const response = await fetch(`${API_BASE_URL}/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to load profile');
  }

  return (await response.json()) as MeProfileResponse;
}

export async function refreshToken(refreshToken: string): Promise<TokenResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  return (await response.json()) as TokenResponse;
}

export async function logout(refreshToken: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    // Best-effort logout – ignore network errors here
  }
}

export async function registerCompany(payload: RegisterCompanyPayload): Promise<void> {
  const body = {
    name: payload.name,
    taxId: payload.taxId,
    mainEmail: payload.mainEmail,
    phoneNumber: payload.phoneNumber || undefined,
    addresses: [
      {
        address: payload.address.address,
        city: payload.address.city,
        postalCode: payload.address.postalCode,
        country: payload.address.country,
        type: 'BILLING' as const,
      },
    ],
    email: payload.user.email,
    password: payload.user.password,
  };

  const response = await fetch(`${API_BASE_URL}/auth/register-company`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorMessage = 'Company registration failed';
    try {
      const errorData = await response.json() as { error?: string; message?: string };
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      // Jeśli nie można sparsować JSON, użyj domyślnego komunikatu
      errorMessage = `Błąd ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }
}

