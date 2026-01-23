import { apiRequest } from './client';
import { UserAccount, UserRole } from '../types';

export interface ListUsersResponse {
  users: UserAccount[];
}

export interface CreateUserRequest {
  email: string;
  password: string;
  role: UserRole;
  customerCompanyId?: number | null;
  employeeId?: number | null;
}

// Backend CreateUserRequest type
interface BackendCreateUserRequest {
  email: string;
  password: string;
  role: UserRole;
  AssignTo: number;
  accountType: 'CUSTOMER_COMPANY' | 'EMPLOYEE' | 'UNSPECIFIED';
}

export interface UpdateUserRequest {
  email?: string;
  role?: UserRole;
  customerCompanyId?: number | null;
  employeeId?: number | null;
}

// Backend UserWithDetails type
interface BackendUserWithDetails {
  userId: number;
  name: string | null;
  email: string;
  role: string;
  accountType: string;
  status: string;
  lastLoginAt: string | null;
}

// Map backend UserWithDetails to frontend UserAccount
function mapBackendUserToUserAccount(backend: BackendUserWithDetails): UserAccount {
  return {
    id: backend.userId,
    email: backend.email,
    passwordHash: '', // Backend doesn't return password hash
    role: backend.role as UserRole,
    isActive: backend.status === 'ACTIVE',
    lastLoginAt: backend.lastLoginAt ? new Date(backend.lastLoginAt) : null,
    // Note: Backend doesn't return employeeId/customerCompanyId in list endpoint
    // We would need to fetch user details to get these, or modify backend to include them
    employeeId: null,
    customerCompanyId: null,
  };
}

// Lista użytkowników
export async function listUsers(): Promise<UserAccount[]> {
  try {
    const response = await apiRequest<{ Users?: BackendUserWithDetails[]; users?: BackendUserWithDetails[] }>('/users');
    
    if (!response) {
      console.warn('listUsers - Response is null or undefined');
      return [];
    }
    
    // Backend zwraca "users" (małą literą), ale sprawdzamy oba warianty dla kompatybilności
    const usersArray = response.Users || response.users;
    
    if (!usersArray) {
      console.warn('listUsers - Response does not have Users/users property. Keys:', Object.keys(response));
      console.warn('listUsers - Full response:', JSON.stringify(response, null, 2));
      return [];
    }
    
    return usersArray.map(mapBackendUserToUserAccount);
  } catch (error) {
    console.error('listUsers - Error fetching users:', error);
    throw error;
  }
}

// Szczegóły użytkownika
export async function getUser(userId: number): Promise<UserAccount> {
  const response = await apiRequest<BackendUserWithDetails>(`/users/${userId}`);
  return mapBackendUserToUserAccount(response);
}

// Utwórz użytkownika
export async function createUser(request: CreateUserRequest): Promise<UserAccount> {
  // Map frontend request to backend format
  let backendRequest: BackendCreateUserRequest;
  
  console.log('createUser - Frontend request:', {
    email: request.email,
    role: request.role,
    employeeId: request.employeeId,
    customerCompanyId: request.customerCompanyId,
  });
  
  if (request.employeeId) {
    backendRequest = {
      email: request.email,
      password: request.password,
      role: request.role,
      AssignTo: request.employeeId,
      accountType: 'EMPLOYEE',
    };
  } else if (request.customerCompanyId) {
    backendRequest = {
      email: request.email,
      password: request.password,
      role: request.role,
      AssignTo: request.customerCompanyId,
      accountType: 'CUSTOMER_COMPANY',
    };
  } else {
    backendRequest = {
      email: request.email,
      password: request.password,
      role: request.role,
      AssignTo: 0,
      accountType: 'UNSPECIFIED',
    };
  }
  
  console.log('createUser - Backend request:', {
    ...backendRequest,
    password: '***',
  });
  
  try {
    await apiRequest<void>('/users', {
      method: 'POST',
      body: JSON.stringify(backendRequest),
    });
    console.log('createUser - Success');
  } catch (error) {
    console.error('createUser - Error:', error);
    throw error;
  }
  
  // Backend returns 201 with no body, so we need to fetch the user list to get the new user
  // For now, return a placeholder - in production you might want to return the created user
  return {
    id: 0,
    email: request.email,
    role: request.role,
    isActive: true,
    employeeId: request.employeeId || null,
    customerCompanyId: request.customerCompanyId || null,
    lastLoginAt: null,
  } as UserAccount;
}

// Aktualizuj użytkownika
export async function updateUser(
  userId: number,
  request: UpdateUserRequest
): Promise<UserAccount> {
  return apiRequest<UserAccount>(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(request),
  });
}

// Zablokuj użytkownika
export async function blockUser(userId: number): Promise<void> {
  await apiRequest<void>(`/users/${userId}/block`, {
    method: 'PATCH',
  });
}

// Odblokuj użytkownika
export async function unblockUser(userId: number): Promise<void> {
  await apiRequest<void>(`/users/${userId}/unblock`, {
    method: 'PATCH',
  });
}
