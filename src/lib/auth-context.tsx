"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { OrgRole } from "@/models/Organization";
import type { PendingInvitation } from "@/lib/invitation-utils";

interface User {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface Organization {
  _id: string;
  name: string;
  slug: string;
}

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  role: OrgRole | null;
  pendingInvitations: PendingInvitation[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    orgName: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [role, setRole] = useState<OrgRole | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setOrganization(data.organization || null);
        setRole(data.role || null);
        setPendingInvitations(data.pendingInvitations || []);
      } else {
        setUser(null);
        setOrganization(null);
        setRole(null);
        setPendingInvitations([]);
      }
    } catch {
      setUser(null);
      setOrganization(null);
      setRole(null);
      setPendingInvitations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Login failed");
    }

    const data = await res.json();
    setUser(data.user);
    setOrganization(data.organization);
    setRole(data.role);
    setPendingInvitations(data.pendingInvitations || []);
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    orgName: string
  ) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, orgName }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Registration failed");
    }

    const data = await res.json();
    setUser(data.user);
    setOrganization(data.organization);
    setRole(data.role);
    setPendingInvitations(data.pendingInvitations || []);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setOrganization(null);
    setRole(null);
    setPendingInvitations([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        role,
        pendingInvitations,
        isLoading,
        login,
        register,
        logout,
        refresh: fetchSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
