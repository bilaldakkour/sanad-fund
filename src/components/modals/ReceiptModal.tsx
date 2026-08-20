"use client";

import { Printer, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAppData } from "@/lib/AppDataProvider";
import { fmt, receiptNo } from "@/lib/format";
import type { LedgerEntry } from "@/lib/types";

export function ReceiptModal({ entry, onClose }: { entry: LedgerEntry; onClose: () => void }) {
  const { t, lang } = useLanguage();
  const { settings, currencies } = useAppData();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="print:hidden absolute top-4 left-4 text-slate-400">
          <X size={20} />
        </button>
        <div className="text-center border-b-2 border-dashed border-slate-200 pb-4 mb-4">
          <div className="flex justify-center">
            <Logo size={44} />
          </div>
          <p className="font-black text-lg mt-2">{lang === "ar" ? settings.org_name_ar : settings.org_name_en}</p>
          <p className="text-[11px] text-slate-400">{lang === "ar" ? settings.tagline_ar : settings.tagline_en}</p>
        </div>
        <p className="text-center text-[11px] text-slate-400 num-mono">
          {t.receiptNo}: #{receiptNo(entry.entryNo)}
        </p>
        <p className="text-center font-black text-xl text-slate-900 mt-4">{entry.personName}</p>
        <p className="text-center text-sm text-slate-600 mt-2">{t.receiptDonated}</p>
        <p className="text-center font-black text-3xl text-orange-600 num-mono mt-1">
          {fmt(entry.amount ?? 0, entry.currency, currencies)}
        </p>
        <p className="text-center text-xs text-slate-400 mt-2">
          {t.receiptOn} {entry.date}
        </p>
        <p className="text-center text-sm text-slate-600 mt-5 border-t-2 border-dashed border-slate-200 pt-4">
          {lang === "ar" ? settings.thank_you_ar : settings.thank_you_en}
        </p>
        <button
          onClick={() => window.print()}
          className="print:hidden w-full bg-slate-900 text-white rounded-xl py-2.5 font-bold text-sm mt-5 flex items-center justify-center gap-2 transition-transform duration-150 active:scale-[0.98]"
        >
          <Printer size={16} /> {t.print}
        </button>
      </div>
    </div>
  );
}
