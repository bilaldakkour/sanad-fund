"use client";

import { createContext, useContext } from "react";
import type { AppNotification, Currency, FundSettings, Profile } from "@/lib/types";

interface AppData {
  profile: Profile;
  currencies: Currency[];
  settings: FundSettings;
  notifications: AppNotification[];
  unreadCount: number;
  approvedMembers: Profile[];
}

const AppDataContext = createContext<AppData | null>(null);

export function AppDataProvider({
  value,
  children,
}: {
  value: AppData;
  children: React.ReactNode;
}) {
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within an AppDataProvider");
  return ctx;
}
