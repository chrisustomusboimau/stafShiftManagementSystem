import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { api } from "../api/client";

type User = { id: number; username: string; role: "admin" | "staff" };

type AuthCtx = {
  token: string | null;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as User) : null;
  });

  useEffect(() => {
    if (token && !user) {
      api.get("/auth/me").then((r) => {
        setUser(r.data);
        localStorage.setItem("user", JSON.stringify(r.data));
      }).catch(() => {});
    }
  }, [token, user]);

  const login = useCallback(async (username: string, password: string) => {
    const form = new URLSearchParams();
    form.append("username", username);
    form.append("password", password);
    const { data } = await api.post("/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);
    const me = await api.get("/auth/me", {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    setUser(me.data);
    localStorage.setItem("user", JSON.stringify(me.data));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({ token, user, login, logout, isAdmin: user?.role === "admin" }),
    [token, user, login, logout]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be inside AuthProvider");
  return v;
}
