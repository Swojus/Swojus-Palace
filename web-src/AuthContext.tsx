import React from "react";

type AuthContextType = {
  roleId: number;
  setRoleId: (id: number) => void;
  isAdmin: boolean;
  isManager: boolean;
};

const STORAGE_KEY = "eventflow/role_id";

const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [roleId, setRoleIdState] = React.useState<number>(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? Number(raw) : 1; // default to admin for now
    } catch (e) {
      return 1;
    }
  });

  const setRoleId = (id: number) => {
    setRoleIdState(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(id));
    } catch (e) {
      // ignore
    }
  };

  const value: AuthContextType = {
    roleId,
    setRoleId,
    isAdmin: roleId === 1,
    isManager: roleId !== 1,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export default AuthContext;
