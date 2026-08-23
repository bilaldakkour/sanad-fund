"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LifeBuoy, Receipt, User } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const COLOR_STYLES: Record<string, { active: string; inactive: string; label: string }> = {
  orange: {
    active: "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-orange-600/30",
    inactive: "bg-orange-50 text-orange-400",
    label: "text-orange-600",
  },
  sky: {
    active: "bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-sky-600/30",
    inactive: "bg-sky-50 text-sky-400",
    label: "text-sky-600",
  },
  amber: {
    active: "bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-amber-600/30",
    inactive: "bg-amber-50 text-amber-400",
    label: "text-amber-600",
  },
  violet: {
    active: "bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-violet-600/30",
    inactive: "bg-violet-50 text-violet-400",
    label: "text-violet-600",
  },
};

export function BottomNav() {
  const { t } = useLanguage();
  const pathname = usePathname();

  const items = [
    { href: "/", label: t.nav.home, icon: Home, color: "orange" },
    { href: "/ledger", label: t.nav.ledger, icon: Receipt, color: "sky" },
    { href: "/cases", label: t.nav.cases, icon: LifeBuoy, color: "amber" },
    { href: "/profile", label: t.nav.profile, icon: User, color: "violet" },
  ];

  return (
    <nav className="print:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 z-20 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-lg mx-auto grid grid-cols-4 py-2">
        {items.map(({ href, label, icon: Icon, color }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          const styles = COLOR_STYLES[color];
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 min-w-0 py-0.5">
              <span
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                  active ? `shadow-sm ${styles.active}` : styles.inactive
                }`}
              >
                <Icon size={17} />
              </span>
              <span className={`text-[10px] font-bold truncate ${active ? styles.label : "text-slate-400"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
