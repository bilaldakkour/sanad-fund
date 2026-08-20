"use client";

import { useState } from "react";
import {
  Bell,
  ClipboardCheck,
  FileBarChart,
  HandCoins,
  Languages,
  LogOut,
  Menu,
  Settings as SettingsIcon,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { RoleBadge } from "@/components/RoleBadge";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAppData } from "@/lib/AppDataProvider";
import { signOut } from "@/app/actions/auth";
import { NotificationsSheet } from "@/components/modals/NotificationsSheet";
import { Sidebar } from "@/components/Sidebar";
import { APPROVER_ROLES, HANDOVER_ROLES, REPORT_ROLES } from "@/lib/types";

export function Header() {
  const { t, lang, toggleLang } = useLanguage();
  const { profile, settings, notifications, unreadCount } = useAppData();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const sidebarItems = [
    ...(REPORT_ROLES.includes(profile.role) ? [{ href: "/reports", label: t.nav.reports, icon: FileBarChart }] : []),
    ...(HANDOVER_ROLES.includes(profile.role) ? [{ href: "/handover", label: t.nav.handover, icon: HandCoins }] : []),
    ...(APPROVER_ROLES.includes(profile.role)
      ? [{ href: "/approvals", label: t.nav.approvals, icon: ClipboardCheck }]
      : []),
    ...(profile.role === "admin" ? [{ href: "/settings", label: t.nav.settings, icon: SettingsIcon }] : []),
  ];

  return (
    <>
      <header className="print:hidden sticky top-0 z-20 bg-gradient-to-b from-slate-900 to-slate-800 text-white px-4 pt-4 pb-4 shadow-lg shadow-slate-900/10 rounded-b-3xl">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {sidebarItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowSidebar(true)}
                  className="me-1 flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200 transition-transform duration-150 active:scale-90 hover:bg-slate-700"
                >
                  <Menu size={16} />
                </button>
              )}
              <Logo size={36} />
              <div>
                <p className="font-black text-base leading-tight">
                  {lang === "ar" ? settings.org_name_ar : settings.org_name_en}
                </p>
                <p className="text-[11px] text-orange-300">
                  {lang === "ar" ? settings.tagline_ar : settings.tagline_en}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowNotifs(true)}
                className="relative flex items-center bg-slate-800/80 text-orange-300 p-1.5 rounded-lg border border-slate-700 transition-transform duration-150 active:scale-90 hover:bg-slate-700"
              >
                <Bell size={14} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -end-1.5 bg-orange-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={toggleLang}
                className="flex items-center gap-1 bg-slate-800/80 text-orange-300 text-xs font-bold px-2 py-1 rounded-lg border border-slate-700 transition-transform duration-150 active:scale-95 hover:bg-slate-700"
              >
                <Languages size={12} /> {lang === "ar" ? "EN" : "عربي"}
              </button>
              <RoleBadge role={profile.role} />
            </div>
          </div>

          <div className="mt-3 bg-slate-800/80 rounded-xl p-2 flex items-center justify-between gap-2 text-[11px]">
            <span className="text-slate-300 font-bold truncate">{profile.full_name}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-1 text-slate-400 hover:text-orange-300 shrink-0 transition-colors duration-150"
              >
                <LogOut size={12} /> {t.logout}
              </button>
            </form>
          </div>
        </div>
      </header>

      {showNotifs && (
        <NotificationsSheet notifications={notifications} onClose={() => setShowNotifs(false)} />
      )}
      {showSidebar && <Sidebar items={sidebarItems} onClose={() => setShowSidebar(false)} />}
    </>
  );
}
