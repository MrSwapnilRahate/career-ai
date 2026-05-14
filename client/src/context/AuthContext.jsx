import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, setTokens, clearTokens, hasTokens } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user profile on mount if tokens exist
  useEffect(() => {
    if (hasTokens()) {
      authAPI.profile()
        .then((res) => setUser(res.data))
        .catch(() => { clearTokens(); setUser(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async ({ name, email, password }) => {
    const res = await authAPI.signup({ name, email, password });
    setTokens(res.data.accessToken, res.data.refreshToken);
    setUser(res.data.user);
    return res;
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const res = await authAPI.login({ email, password });
    setTokens(res.data.accessToken, res.data.refreshToken);
    setUser(res.data.user);
    return res;
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch {}
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
