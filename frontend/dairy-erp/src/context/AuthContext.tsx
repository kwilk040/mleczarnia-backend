import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { UserAccount, AuthState, UserRole } from '../types';
import * as authApi from '../api/auth';

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(() => {
    try {
      const storedUser = localStorage.getItem('auth_user');
      if (!storedUser) return null;
      const parsed = JSON.parse(storedUser) as UserAccount;
      return parsed;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const tokens = await authApi.login({ email, password });

      const profile = await authApi.getProfile(tokens.accessToken);

      const mappedUser: UserAccount = {
        id: 0,
        email: profile.email,
        passwordHash: '',
        role: profile.role as UserRole,
        isActive: true,
        lastLoginAt: profile.lastLoginAt ? new Date(profile.lastLoginAt) : null,
        customerCompanyId: profile.customerCompanyId ?? null,
        employeeId: profile.employeeId ?? null,
      };

      localStorage.setItem('auth_user', JSON.stringify(mappedUser));
      localStorage.setItem(
        'auth_tokens',
        JSON.stringify({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        }),
      );

      setUser(mappedUser);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    try {
      const rawTokens = localStorage.getItem('auth_tokens');
      if (rawTokens) {
        const tokens = JSON.parse(rawTokens) as authApi.TokenResponse;
        if (tokens.refreshToken) {
          void authApi.logout(tokens.refreshToken);
        }
      }
    } catch {
      // ignore
    }

    setUser(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_tokens');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

