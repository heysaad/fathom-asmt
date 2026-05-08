"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import apiClient from "./api-client";

export type UserInfo = {
  id: string;
  email: string;
  name?: string;
  is_active?: boolean;
  is_verified?: boolean;
};

type UserContextType = {
  user: UserInfo | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/auth/users/me");
      setUser(response.data as UserInfo);
    } catch (error) {
      console.error("Failed to load current user", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const value = useMemo(
    () => ({ user, loading, refreshUser }),
    [user, loading]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
