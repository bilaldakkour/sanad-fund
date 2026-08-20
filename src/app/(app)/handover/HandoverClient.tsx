"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HandCoins, Printer } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAppData } from "@/lib/AppDataProvider";
import { fmt, formatDateLabel, receiptNo } from "@/lib/format";
import { Logo } from "@/components/Logo";
import type { HandoverDonation } from "./page";

export function HandoverClient({
  from,
  to,
  donations,
}: {
  from: string;
  to: string;
  donations: HandoverDonation[];
}) {
  const { t, lang, dir } = useLanguage();
  const { currencies, settings, profile } = useAppData();
  const router = useRouter();
  const [fromDate, setFromDate] = useState(from);
  const [toDate, setToDate] = useState(to);
  const [rangeError, setRangeError] = useState(false);

  const totals = useMemo(() => {
    const map: Record<string, number> = {};
    donations.forEach((d) => {
      map[d.currency] = (map[d.currency] || 0) + d.amount;
    });
    return map;
  }, [donations]);

  const periodLabel =
    from === to ? formatDateLabel(from, lang) : `${formatDateLabel(from, lang)} — ${formatDateLabel(to, lang)}`;
  const generatedOn = new Date().toISOString().slice(0, 10);

  function applyRange() {
    if (fromDate > toDate) {
      setRangeError(true);
      return;
    }
    setRangeError(false);
    router.push(`/handover?from=${fromDate}&to=${toDate}`);
  }

  return (
    <>
      {/* ---------- شاشة عادية ---------- */}
      <div className="print:hidden space-y-4">
        <div>
          <p className="font-black text-slate-800 text-lg flex items-center gap-2">
            <HandCoins size={20} className="text-orange-600" /> {t.handoverTitle}
          </p>
          <p className="text-slate-400 text-xs mt-0.5">{t.handoverSubtitle}</p>
        </div>

        <div className="bg-white rounded-2xl p-3 shadow-sm space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">{t.fromDate}</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-2 py-2 text-xs outline-none transition-colors duration-150 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">{t.toDate}</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-2 py-2 text-xs outline-none transition-colors duration-150 focus:border-orange-500"
              />
            </div>
          </div>
          {rangeError && <p className="text-[11px] text-red-600">{t.invalidRange}</p>}
          <button
            type="button"
            onClick={applyRange}
            className="w-full bg-slate-900 text-white rounded-xl py-2 text-xs font-bold transition-transform duration-150 active:scale-[0.98]"
          >
            {periodLabel}
          </button>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-950 text-white rounded-3xl p-5 shadow-lg">
          <p className="text-orange-300 text-xs">{t.totalCollected}</p>
          <div className="mt-2 space-y-1.5">
            {Object.keys(totals).length === 0 ? (
              <p className="text-slate-400 text-sm">{t.noCollections}</p>
            ) : (
              Object.entries(totals).map(([code, amt]) => (
                <div key={code} className="flex items-baseline justify-between border-b border-white/10 pb-1.5 last:border-0">
                  <span className="text-slate-400 text-xs font-bold">{code}</span>
                  <span className="num-mono text-xl font-black">{fmt(amt, code, currencies)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {donations.length > 0 && (
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full bg-orange-600 text-white rounded-xl py-2.5 font-bold text-sm flex items-center justify-center gap-2 transition-transform duration-150 active:scale-[0.98]"
          >
            <Printer size={16} /> {t.printReport}
          </button>
        )}

        <div className="space-y-2">
          {donations.map((d) => (
            <div key={d.id} className="bg-white rounded-2xl p-3 shadow-sm flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-slate-800 text-sm truncate">{d.member_name}</p>
                <p className="text-[11px] text-slate-400">
                  #{receiptNo(d.entry_no)} · {d.donated_at}
                </p>
              </div>
              <p className="num-mono font-bold text-orange-600 text-sm shrink-0">
                +{fmt(d.amount, d.currency, currencies)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- نسخة الطباعة (A4) ---------- */}
      <div className="hidden print:block text-slate-900" dir={dir}>
        <div className="flex items-center gap-3 border-b-2 border-slate-800 pb-4">
          <Logo size={40} />
          <div>
            <p className="font-black text-xl">{lang === "ar" ? settings.org_name_ar : settings.org_name_en}</p>
            <p className="text-sm text-slate-500">{lang === "ar" ? settings.tagline_ar : settings.tagline_en}</p>
          </div>
        </div>

        <h1 className="text-2xl font-black mt-6">{t.handoverSlipTitle}</h1>
        <div className="flex justify-between text-sm text-slate-600 mt-1">
          <p>
            {t.collectorName}: <span className="font-bold">{profile.full_name}</span>
          </p>
          <p>
            {t.reportPeriod}: <span className="font-bold">{periodLabel}</span>
          </p>
          <p>
            {t.reportGeneratedOn}: <span className="font-bold num-mono">{generatedOn}</span>
          </p>
        </div>

        <table className="w-full mt-6 border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-slate-800">
              <th className="text-start py-2">#</th>
              <th className="text-start py-2">{lang === "ar" ? "اسم المتبرع" : "Donor"}</th>
              <th className="text-start py-2">{t.amountPlaceholder}</th>
              <th className="text-start py-2">{lang === "ar" ? "التاريخ" : "Date"}</th>
            </tr>
          </thead>
          <tbody>
            {donations.map((d) => (
              <tr key={d.id} className="border-b border-slate-200">
                <td className="py-1.5 num-mono">{receiptNo(d.entry_no)}</td>
                <td className="py-1.5">{d.member_name}</td>
                <td className="py-1.5 num-mono">{fmt(d.amount, d.currency, currencies)}</td>
                <td className="py-1.5 num-mono">{d.donated_at}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            {Object.entries(totals).map(([code, amt]) => (
              <tr key={code} className="border-t-2 border-slate-800 font-bold">
                <td className="py-2" colSpan={2}>
                  {t.totalCollected} ({code})
                </td>
                <td className="py-2 num-mono" colSpan={2}>
                  {fmt(amt, code, currencies)}
                </td>
              </tr>
            ))}
          </tfoot>
        </table>

        <p className="text-xs text-slate-500 mt-8">{t.handoverFooterNote}</p>

        <div className="grid grid-cols-2 gap-8 mt-16">
          <div className="border-t border-slate-400 pt-2 text-xs text-slate-500">{t.signatureCollector}</div>
          <div className="border-t border-slate-400 pt-2 text-xs text-slate-500">{t.signatureTreasurer}</div>
        </div>
      </div>
    </>
  );
}
