"use client";

import { createContext, useContext, useState, useEffect, useCallback, useTransition, ReactNode } from "react";
import { getMe, logout as apiLogout, type User } from "@/lib/api/auth";
import { getAccessToken, loadPersistedRefreshToken } from "@/lib/api/client";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [, startTransition] = useTransition();
  useEffect(() => {
    loadPersistedRefreshToken();
    if (!getAccessToken() && !localStorage.getItem("oqupy_refresh")) {
      startTransition(() => setIsLoading(false));
      return;
    }
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, [startTransition]);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
