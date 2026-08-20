"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardCheck,
  FileBarChart,
  HandCoins,
  HeartHandshake,
  Home,
  Receipt,
  Settings as SettingsIcon,
  User,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAppData } from "@/lib/AppDataProvider";
import { APPROVER_ROLES, HANDOVER_ROLES, REPORT_ROLES } from "@/lib/types";

export function BottomNav() {
  const { t } = useLanguage();
  const { profile } = useAppData();
  const pathname = usePathname();

  const isApprover = APPROVER_ROLES.includes(profile.role);
  const canSeeReports = REPORT_ROLES.includes(profile.role);
  const canHandover = HANDOVER_ROLES.includes(profile.role);
  const isAdmin = profile.role === "admin";

  const items = [
    { href: "/", label: t.nav.home, icon: Home },
    { href: "/ledger", label: t.nav.ledger, icon: Receipt },
    { href: "/cases", label: t.nav.cases, icon: HeartHandshake },
    { href: "/profile", label: t.nav.profile, icon: User },
    ...(canSeeReports ? [{ href: "/reports", label: t.nav.reports, icon: FileBarChart }] : []),
    ...(canHandover ? [{ href: "/handover", label: t.nav.handover, icon: HandCoins }] : []),
    ...(isApprover ? [{ href: "/approvals", label: t.nav.approvals, icon: ClipboardCheck }] : []),
    ...(isAdmin ? [{ href: "/settings", label: t.nav.settings, icon: SettingsIcon }] : []),
  ];

  return (
    <nav className="print:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 z-20">
      <div className="max-w-lg mx-auto flex justify-around py-2 overflow-x-auto">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-0.5 px-2 shrink-0">
              <Icon size={20} className={active ? "text-orange-600" : "text-slate-500"} />
              <span className={`text-[10px] font-bold ${active ? "text-orange-600" : "text-slate-500"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
