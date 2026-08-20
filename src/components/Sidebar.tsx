"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Logo } from "@/components/Logo";
import type { LucideIcon } from "lucide-react";

export interface SidebarItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function Sidebar({ items, onClose }: { items: SidebarItem[]; onClose: () => void }) {
  const { t, dir } = useLanguage();
  const pathname = usePathname();
  const side = dir === "rtl" ? "right-0" : "left-0";

  return (
    <div className="print:hidden fixed inset-0 z-40 flex" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        onClick={(e) => e.stopPropagation()}
        className={`sidebar-panel absolute top-0 bottom-0 ${side} w-72 max-w-[80vw] bg-white shadow-2xl flex flex-col`}
      >
        <div className="bg-slate-900 text-white px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={30} />
            <p className="font-black text-sm">{t.appName}</p>
          </div>
          <button type="button" onClick={onClose}>
            <X size={20} className="text-slate-300" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-3 rounded-2xl transition-colors duration-150 ${
                  active ? "bg-orange-50 text-orange-700" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    active ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Icon size={18} />
                </span>
                <span className="font-bold text-sm">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
