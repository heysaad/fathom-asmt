"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import apiClient from "./api-client";

export type UserInfo = {
  id: string;
  email: string;
  name?: string;
  is_active?: boolean;
  is_verified?: boolean;
  role?: "crew" | "admin";
};

type UserContextType = {
  user?: UserInfo;
  loading: boolean;
  refreshUser: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo>();
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setUser(undefined);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.get<UserInfo>("/auth/users/me");
      setUser(response.data);
    } catch (error) {
      console.error("Failed to load current user", error);
      setUser(undefined);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const value = useMemo(
    () => ({ user, loading, refreshUser }),
    [user, loading],
  );

  return (
    <UserContext.Provider value={value || undefined}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
