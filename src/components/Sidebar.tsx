"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAppData } from "@/lib/AppDataProvider";
import { Logo } from "@/components/Logo";
import { BrandRings } from "@/components/BrandRings";
import { RoleBadge } from "@/components/RoleBadge";
import type { LucideIcon } from "lucide-react";

export interface SidebarItem {
  href: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

export function Sidebar({ items, onClose }: { items: SidebarItem[]; onClose: () => void }) {
  const { t, lang, dir } = useLanguage();
  const { profile, settings } = useAppData();
  const pathname = usePathname();
  const side = dir === "rtl" ? "right-0" : "left-0";

  return (
    <div className="print:hidden fixed inset-0 z-40 flex" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        onClick={(e) => e.stopPropagation()}
        className={`sidebar-panel absolute top-0 bottom-0 ${side} w-72 max-w-[80vw] bg-white shadow-2xl flex flex-col`}
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-950 text-white px-4 pt-4 pb-5 shrink-0">
          <div className="absolute -end-10 -top-12 w-36 h-36 rounded-full bg-orange-600/20 blur-2xl" />
          <div className="relative flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Logo size={28} />
              <p className="font-black text-sm">{t.appName}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center transition-colors duration-150 hover:bg-white/15"
            >
              <X size={17} className="text-slate-300" />
            </button>
          </div>
          <div className="relative flex items-center gap-3 bg-white/5 rounded-2xl p-3 ring-1 ring-white/10">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center font-black text-white shrink-0 shadow-lg shadow-orange-600/25">
              {profile.full_name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm truncate">{profile.full_name}</p>
              <div className="mt-0.5">
                <RoleBadge role={profile.role} />
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {items.map(({ href, label, icon: Icon, color }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-150 ${
                  active ? "bg-orange-50 text-orange-700" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br text-white shadow-sm ${color}`}
                >
                  <Icon size={17} />
                </span>
                <span className="font-bold text-sm flex-1">{label}</span>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
              </Link>
            );
          })}
        </nav>

        <div className="relative overflow-hidden shrink-0 border-t border-slate-100 px-4 pt-3 pb-4">
          <BrandRings className="absolute -start-4 -bottom-6 w-24 h-24 text-orange-500/[0.06]" />
          <div className="relative flex items-center justify-center gap-3 mb-2">
            <Link href="/terms" onClick={onClose} className="text-[11px] font-bold text-slate-500 underline">
              {t.termsLink}
            </Link>
            <span className="text-slate-200">·</span>
            <Link href="/privacy" onClick={onClose} className="text-[11px] font-bold text-slate-500 underline">
              {t.privacyLink}
            </Link>
          </div>
          <p className="relative text-[10px] text-slate-400 text-center">
            {lang === "ar" ? settings.tagline_ar : settings.tagline_en}
          </p>
        </div>
      </div>
    </div>
  );
}
