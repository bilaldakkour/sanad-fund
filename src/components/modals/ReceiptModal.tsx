"use client";

import { useRef, useState } from "react";
import { toBlob } from "html-to-image";
import { Printer, Share2, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAppData } from "@/lib/AppDataProvider";
import { fmt, receiptNo } from "@/lib/format";
import type { LedgerEntry } from "@/lib/types";

export function ReceiptModal({ entry, onClose }: { entry: LedgerEntry; onClose: () => void }) {
  const { t, lang } = useLanguage();
  const { settings, currencies } = useAppData();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);

  async function handleShare() {
    if (!receiptRef.current || sharing) return;
    setSharing(true);
    try {
      const blob = await toBlob(receiptRef.current, { pixelRatio: 2, backgroundColor: "#ffffff" });
      if (!blob) return;
      const filename = `receipt-${receiptNo(entry.entryNo)}.png`;
      const file = new File([blob], filename, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: t.receiptNo });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // المستخدم ألغى نافذة المشاركة — مش خطأ نعرضه.
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="print:hidden absolute top-4 left-4 text-slate-400">
          <X size={20} />
        </button>
        <div ref={receiptRef} className="bg-white">
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
        </div>
        <div className="print:hidden flex gap-2 mt-5">
          <button
            onClick={() => window.print()}
            className="flex-1 bg-slate-900 text-white rounded-xl py-2.5 font-bold text-sm flex items-center justify-center gap-2 transition-transform duration-150 active:scale-[0.98]"
          >
            <Printer size={16} /> {t.print}
          </button>
          <button
            onClick={handleShare}
            disabled={sharing}
            className="flex-1 bg-orange-600 text-white rounded-xl py-2.5 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-transform duration-150 active:scale-[0.98]"
          >
            <Share2 size={16} /> {sharing ? "..." : t.shareReceipt}
          </button>
        </div>
      </div>
    </div>
  );
}
