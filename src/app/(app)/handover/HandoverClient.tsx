"use client";

import { useEffect, useState, useTransition } from "react";
import { HandCoins, Printer, Send } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAppData } from "@/lib/AppDataProvider";
import { fmt, receiptNo } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import { Logo } from "@/components/Logo";
import { requestHandover } from "@/app/actions/handover";
import type { HandoverBatch, HandoverDonation } from "./page";

export function HandoverClient({
  pendingDonations,
  batches,
}: {
  pendingDonations: HandoverDonation[];
  batches: HandoverBatch[];
}) {
  const { t, lang, dir } = useLanguage();
  const { currencies, settings, profile } = useAppData();
  const [isPending, startTransition] = useTransition();
  const [printingBatch, setPrintingBatch] = useState<HandoverBatch | null>(null);

  const pendingTotals: Record<string, number> = {};
  pendingDonations.forEach((d) => {
    pendingTotals[d.currency] = (pendingTotals[d.currency] || 0) + d.amount;
  });

  useEffect(() => {
    if (printingBatch) window.print();
  }, [printingBatch]);

  function handleRequestHandover() {
    if (!window.confirm(t.requestHandoverConfirm)) return;
    startTransition(() => requestHandover());
  }

  return (
    <>
      <div className="print:hidden space-y-4">
        <div>
          <p className="font-black text-slate-800 text-lg flex items-center gap-2">
            <HandCoins size={20} className="text-orange-600" /> {t.handoverTitle}
          </p>
          <p className="text-slate-400 text-xs mt-0.5">{t.handoverSubtitle}</p>
        </div>

        <div>
          <p className="font-bold text-slate-700 text-sm mb-2">{t.pendingHandoverDonations}</p>
          {pendingDonations.length === 0 ? (
            <EmptyState icon={HandCoins} title={t.noUnsettledCollections} />
          ) : (
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-slate-800 to-slate-950 text-white rounded-3xl p-5 shadow-lg">
                <p className="text-orange-300 text-xs">{t.totalCollected}</p>
                <div className="mt-2 space-y-1.5">
                  {Object.entries(pendingTotals).map(([code, amt]) => (
                    <div
                      key={code}
                      className="flex items-baseline justify-between border-b border-white/10 pb-1.5 last:border-0"
                    >
                      <span className="text-slate-400 text-xs font-bold">{code}</span>
                      <span className="num-mono text-xl font-black">{fmt(amt, code, currencies)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={isPending}
                onClick={handleRequestHandover}
                className="w-full bg-orange-600 text-white rounded-xl py-2.5 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-transform duration-150 active:scale-[0.98]"
              >
                <Send size={16} /> {t.requestHandover}
              </button>

              <div className="space-y-2">
                {pendingDonations.map((d) => (
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
          )}
        </div>

        <div>
          <p className="font-bold text-slate-700 text-sm mb-2">{t.handoverBatches}</p>
          {batches.length === 0 ? (
            <p className="text-slate-400 text-xs">{t.noPendingHandovers}</p>
          ) : (
            <div className="space-y-2">
              {batches.map((b) => (
                <div key={b.id} className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">{b.created_at}</p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        b.status === "confirmed"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {b.status === "confirmed" ? t.handoverStatusConfirmed : t.handoverStatusPending}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {b.totals.map((tot) => (
                      <span
                        key={tot.currency}
                        className="num-mono text-sm font-bold bg-slate-50 text-slate-700 px-3 py-1 rounded-lg"
                      >
                        {fmt(tot.amount, tot.currency, currencies)}
                      </span>
                    ))}
                  </div>
                  {b.status === "confirmed" && b.confirmed_by_name && (
                    <p className="text-[11px] text-slate-400">
                      {t.confirmDonationBtn}: {b.confirmed_by_name} · {b.confirmed_at}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setPrintingBatch(b)}
                    className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-orange-600 transition-colors"
                  >
                    <Printer size={12} /> {t.printReport}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {printingBatch && (
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
              {lang === "ar" ? "التاريخ" : "Date"}: <span className="font-bold num-mono">{printingBatch.created_at}</span>
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
              {printingBatch.donations.map((d) => (
                <tr key={d.id} className="border-b border-slate-200">
                  <td className="py-1.5 num-mono">{receiptNo(d.entry_no)}</td>
                  <td className="py-1.5">{d.member_name}</td>
                  <td className="py-1.5 num-mono">{fmt(d.amount, d.currency, currencies)}</td>
                  <td className="py-1.5 num-mono">{d.donated_at}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              {printingBatch.totals.map((tot) => (
                <tr key={tot.currency} className="border-t-2 border-slate-800 font-bold">
                  <td className="py-2" colSpan={2}>
                    {t.totalCollected} ({tot.currency})
                  </td>
                  <td className="py-2 num-mono" colSpan={2}>
                    {fmt(tot.amount, tot.currency, currencies)}
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
      )}
    </>
  );
}
