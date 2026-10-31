import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { backend } from '@/services/backend';
import type { User } from '@/types';

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    backend
      .getCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setUser(await backend.login(username, password));
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    setUser(await backend.register(username, password));
  }, []);

  const logout = useCallback(async () => {
    await backend.logout();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth, AuthProvider içinde kullanılmalı');
  return ctx;
}
