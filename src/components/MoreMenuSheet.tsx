"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { LucideIcon } from "lucide-react";

export interface MoreMenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function MoreMenuSheet({ items, onClose }: { items: MoreMenuItem[]; onClose: () => void }) {
  const { t } = useLanguage();

  return (
    <div className="print:hidden fixed inset-0 bg-black/40 z-40 flex items-end justify-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-t-3xl p-5 space-y-1 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center justify-between mb-2">
          <p className="font-bold text-slate-800">{t.moreMenu}</p>
          <button type="button" onClick={onClose}>
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-slate-50 text-slate-700"
          >
            <span className="w-9 h-9 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
              <Icon size={18} />
            </span>
            <span className="font-bold text-sm">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
