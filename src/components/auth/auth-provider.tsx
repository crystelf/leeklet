"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, ApiRequestError } from "@/lib/api";
import type {
  AuthChangePasswordReq,
  AuthExchangeKeyReq,
  AuthLoginReq,
  AuthRegisterReq,
  AuthRes,
  Role,
  UserMe,
} from "@/lib/types";

interface AuthContextValue {
  user: UserMe | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<UserMe | null>;
  exchangeKey: (req: AuthExchangeKeyReq) => Promise<void>;
  login: (req: AuthLoginReq) => Promise<void>;
  register: (req: AuthRegisterReq) => Promise<void>;
  changePassword: (req: AuthChangePasswordReq) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const u = await api.get<UserMe>("/users/me");
      let next = u;
      if (!u.nickname) {
        try {
          const refreshed = await api.post<{
            ok: true;
            nickname: string | null;
          }>("/users/me/refresh-nickname");
          if (refreshed.nickname) {
            next = { ...u, nickname: refreshed.nickname };
          }
        } catch {
          next = u;
        }
      }
      setUser(next);
      setError(null);
      return next;
    } catch (e) {
      setUser(null);
      if (e instanceof ApiRequestError && e.status === 403) {
        return null;
      }
      setError(e instanceof Error ? e.message : "获取用户信息失败");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const wrap = useCallback(
    async (fn: () => Promise<AuthRes>, verb: string) => {
      setError(null);
      try {
        const res = await fn();
        if (!res.ok) throw new Error(`${verb}失败`);
        await refresh();
      } catch (e) {
        const msg =
          e instanceof ApiRequestError ? e.body.error : e instanceof Error ? e.message : `${verb}失败`;
        setError(msg);
        throw e;
      }
    },
    [refresh]
  );

  const exchangeKey = useCallback(
    (req: AuthExchangeKeyReq) => wrap(() => api.post<AuthRes>("/auth/exchange-key", req), "登录"),
    [wrap]
  );
  const login = useCallback(
    (req: AuthLoginReq) => wrap(() => api.post<AuthRes>("/auth/login", req), "登录"),
    [wrap]
  );
  const register = useCallback(
    (req: AuthRegisterReq) => wrap(() => api.post<AuthRes>("/auth/register", req), "注册"),
    [wrap]
  );
  const changePassword = useCallback(
    (req: AuthChangePasswordReq) =>
      wrap(() => api.post<AuthRes>("/auth/change-password", req), "改密码"),
    [wrap]
  );

  const logout = useCallback(async () => {
    try {
      await api.post<{ ok: true }>("/auth/logout");
    } catch {
      /* ignore */
    } finally {
      setUser(null);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      refresh,
      exchangeKey,
      login,
      register,
      changePassword,
      logout,
      clearError,
    }),
    [user, loading, error, refresh, exchangeKey, login, register, changePassword, logout, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useRole(): Role | undefined {
  return useAuth().user?.role;
}
