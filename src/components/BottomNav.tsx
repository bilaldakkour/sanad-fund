"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartHandshake, Home, Receipt, User } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function BottomNav() {
  const { t } = useLanguage();
  const pathname = usePathname();

  const items = [
    { href: "/", label: t.nav.home, icon: Home },
    { href: "/ledger", label: t.nav.ledger, icon: Receipt },
    { href: "/cases", label: t.nav.cases, icon: HeartHandshake },
    { href: "/profile", label: t.nav.profile, icon: User },
  ];

  return (
    <nav className="print:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 z-20 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-lg mx-auto grid grid-cols-4 py-2">
        {items.map(({ href, label, icon: Icon }) => {
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
      </div>
    </nav>
  );
}
