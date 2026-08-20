"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardCheck,
  FileBarChart,
  HandCoins,
  HeartHandshake,
  Home,
  MoreHorizontal,
  Receipt,
  Settings as SettingsIcon,
  User,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAppData } from "@/lib/AppDataProvider";
import { APPROVER_ROLES, HANDOVER_ROLES, REPORT_ROLES } from "@/lib/types";
import { MoreMenuSheet } from "@/components/MoreMenuSheet";

export function BottomNav() {
  const { t } = useLanguage();
  const { profile } = useAppData();
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const isApprover = APPROVER_ROLES.includes(profile.role);
  const canSeeReports = REPORT_ROLES.includes(profile.role);
  const canHandover = HANDOVER_ROLES.includes(profile.role);
  const isAdmin = profile.role === "admin";

  const primaryItems = [
    { href: "/", label: t.nav.home, icon: Home },
    { href: "/ledger", label: t.nav.ledger, icon: Receipt },
    { href: "/cases", label: t.nav.cases, icon: HeartHandshake },
    { href: "/profile", label: t.nav.profile, icon: User },
  ];

  const overflowItems = [
    ...(canSeeReports ? [{ href: "/reports", label: t.nav.reports, icon: FileBarChart }] : []),
    ...(canHandover ? [{ href: "/handover", label: t.nav.handover, icon: HandCoins }] : []),
    ...(isApprover ? [{ href: "/approvals", label: t.nav.approvals, icon: ClipboardCheck }] : []),
    ...(isAdmin ? [{ href: "/settings", label: t.nav.settings, icon: SettingsIcon }] : []),
  ];

  const isMoreActive = overflowItems.some((i) => pathname.startsWith(i.href));

  return (
    <>
      <nav className="print:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 z-20 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-lg mx-auto grid grid-cols-5 py-2">
          {primaryItems.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className="flex flex-col items-center gap-0.5 min-w-0">
                <Icon size={20} className={active ? "text-orange-600" : "text-slate-500"} />
                <span className={`text-[10px] font-bold truncate ${active ? "text-orange-600" : "text-slate-500"}`}>
                  {label}
                </span>
              </Link>
            );
          })}
          {overflowItems.length > 0 && (
            <button
              type="button"
              onClick={() => setShowMore(true)}
              className="flex flex-col items-center gap-0.5 min-w-0"
            >
              <MoreHorizontal size={20} className={isMoreActive ? "text-orange-600" : "text-slate-500"} />
              <span className={`text-[10px] font-bold truncate ${isMoreActive ? "text-orange-600" : "text-slate-500"}`}>
                {t.moreMenu}
              </span>
            </button>
          )}
        </div>
      </nav>

      {showMore && <MoreMenuSheet items={overflowItems} onClose={() => setShowMore(false)} />}
    </>
  );
}
