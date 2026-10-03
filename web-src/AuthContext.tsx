import React from "react";
import apiFetch from "./utils/api";

type User = {
  id: string;
  email: string;
  phone?: string;
  roleId: number;
  name?: string;
} | null;

type AuthContextType = {
  user: User;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
};

const TOKEN_KEY = "eventflow/token";

const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = React.useState<string | null>(() => {
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch (e) {
      return null;
    }
  });
  const [user, setUser] = React.useState<User>(null);
  const [loading, setLoading] = React.useState<boolean>(Boolean(token));

  const fetchMe = React.useCallback(async (t: string) => {
    try {
      const res = await apiFetch(`/api/auth/me`, { method: "GET" });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setUser({
        id: data.id,
        email: data.email,
        phone: data.phone,
        roleId: data.roleId,
        name: data.name,
      });
      setLoading(false);
    } catch (e) {
      setToken(null);
      setUser(null);
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (token) {
      void fetchMe(token);
    } else {
      setLoading(false);
    }
  }, [token, fetchMe]);

  React.useEffect(() => {
    const handleAutoLogout = () => {
      setToken(null);
      setUser(null);
      setLoading(false);
      try {
        window.localStorage.removeItem(TOKEN_KEY);
      } catch (e) {}
    };

    window.addEventListener("auth:logout", handleAutoLogout);
    return () => window.removeEventListener("auth:logout", handleAutoLogout);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Login failed");
    }
    const body = await res.json();
    const t = body.token as string;
    setToken(t);
    try {
      window.localStorage.setItem(TOKEN_KEY, t);
    } catch (e) {
      // ignore
    }
    setUser({
      id: body.user.id,
      email: body.user.email,
      phone: body.user.phone,
      roleId: body.user.roleId,
    });
  };

  const logout = () => {
    // call server to clear refresh token cookie
    void fetch(`/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    setToken(null);
    setUser(null);
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch (e) {}
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    logout,
    isAdmin: Boolean(user && user.roleId === 1),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default AuthContext;
