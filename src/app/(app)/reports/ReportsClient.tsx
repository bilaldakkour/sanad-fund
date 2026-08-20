"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, FileBarChart, Printer } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAppData } from "@/lib/AppDataProvider";
import { fmt, formatDateLabel, monthLabel } from "@/lib/format";
import { LedgerRow } from "@/components/LedgerRow";
import { ReceiptModal } from "@/components/modals/ReceiptModal";
import { EditDonationModal } from "@/components/modals/EditDonationModal";
import { Logo } from "@/components/Logo";
import { parseDateInput, shiftRange, toDateInput, toMonthInput, type PeriodType } from "@/lib/period";
import type { LedgerEntry } from "@/lib/types";
import type { MonthlyReportRow } from "./page";

function buildHref(period: PeriodType, anchor: string, end?: string) {
  const params = new URLSearchParams({ period, anchor });
  if (period === "custom" && end) params.set("end", end);
  return `/reports?${params.toString()}`;
}

export function ReportsClient({
  period,
  anchor,
  start,
  end,
  report,
  entries,
}: {
  period: PeriodType;
  anchor: string;
  start: string;
  end: string;
  report: MonthlyReportRow[];
  entries: LedgerEntry[];
}) {
  const { t, lang, dir } = useLanguage();
  const { currencies, settings, profile } = useAppData();
  const router = useRouter();
  const [receiptEntry, setReceiptEntry] = useState<LedgerEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);
  const [customFrom, setCustomFrom] = useState(start);
  const [customTo, setCustomTo] = useState(end);
  const [rangeError, setRangeError] = useState(false);

  const canEdit = ["admin", "treasurer", "collector"].includes(profile.role);
  const anchorDate = parseDateInput(anchor);
  const prevAnchor = toDateInput(shiftRange(period, anchorDate, -1));
  const nextAnchor = toDateInput(shiftRange(period, anchorDate, 1));
  const today = toDateInput(new Date());
  const generatedOn = new Date().toISOString().slice(0, 10);
  const BackChevron = dir === "rtl" ? ChevronRight : ChevronLeft;
  const FwdChevron = dir === "rtl" ? ChevronLeft : ChevronRight;

  const periodLabel = useMemo(() => {
    if (period === "day") return formatDateLabel(start, lang);
    if (period === "month") {
      const [y, m] = start.split("-").map(Number);
      return `${monthLabel(m - 1, lang)} ${y}`;
    }
    return `${formatDateLabel(start, lang)} — ${formatDateLabel(end, lang)}`;
  }, [period, start, end, lang]);

  function applyCustomRange() {
    if (customFrom > customTo) {
      setRangeError(true);
      return;
    }
    setRangeError(false);
    router.push(buildHref("custom", customFrom, customTo));
  }

  return (
    <>
      {/* ---------- شاشة عادية ---------- */}
      <div className="print:hidden space-y-4">
        <div>
          <p className="font-black text-slate-800 text-lg flex items-center gap-2">
            <FileBarChart size={20} className="text-orange-600" /> {t.reportsTitle}
          </p>
          <p className="text-slate-400 text-xs mt-0.5">{t.reportsSubtitle}</p>
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {(
            [
              ["day", t.periodDay],
              ["week", t.periodWeek],
              ["month", t.periodMonth],
              ["custom", t.periodCustom],
            ] as [PeriodType, string][]
          ).map(([k, l]) => (
            <Link
              key={k}
              href={buildHref(k, k === "custom" ? customFrom : today, k === "custom" ? customTo : undefined)}
              className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border ${period === k ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"}`}
            >
              {l}
            </Link>
          ))}
        </div>

        {period === "custom" ? (
          <div className="bg-white rounded-2xl p-3 shadow-sm space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">{t.fromDate}</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-2 py-2 text-xs outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">{t.toDate}</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-2 py-2 text-xs outline-none focus:border-orange-500"
                />
              </div>
            </div>
            {rangeError && <p className="text-[11px] text-red-600">{t.invalidRange}</p>}
            <button onClick={applyCustomRange} className="w-full bg-slate-900 text-white rounded-xl py-2 text-xs font-bold">
              {periodLabel}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-3 shadow-sm flex items-center justify-between gap-2">
            <Link
              href={buildHref(period, prevAnchor)}
              className="w-9 h-9 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center shrink-0"
            >
              <BackChevron size={18} />
            </Link>
            <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <p className="font-bold text-slate-800 text-sm num-mono text-center truncate w-full">{periodLabel}</p>
              {period === "month" ? (
                <input
                  type="month"
                  value={toMonthInput(anchorDate)}
                  onChange={(e) => router.push(buildHref("month", `${e.target.value}-01`))}
                  className="text-[11px] text-slate-400 outline-none bg-transparent num-mono"
                />
              ) : (
                <input
                  type="date"
                  value={anchor}
                  onChange={(e) => router.push(buildHref(period, e.target.value))}
                  className="text-[11px] text-slate-400 outline-none bg-transparent num-mono"
                />
              )}
            </div>
            <Link
              href={buildHref(period, nextAnchor)}
              className="w-9 h-9 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center shrink-0"
            >
              <FwdChevron size={18} />
            </Link>
          </div>
        )}

        <div className="space-y-2">
          {report.map((r) => (
            <div key={r.currency} className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500 mb-2">{r.currency}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 rounded-xl p-2">
                  <p className="text-slate-400">{t.openingBalance}</p>
                  <p className="num-mono font-bold text-slate-700 mt-0.5">
                    {fmt(r.opening_balance, r.currency, currencies)}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-2">
                  <p className="text-slate-400">{t.closingBalance}</p>
                  <p className="num-mono font-bold text-slate-900 mt-0.5">
                    {fmt(r.closing_balance, r.currency, currencies)}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-xl p-2">
                  <p className="text-orange-700">
                    {t.totalIn} ({r.donations_count})
                  </p>
                  <p className="num-mono font-bold text-orange-700 mt-0.5">
                    +{fmt(r.donations_total, r.currency, currencies)}
                  </p>
                </div>
                <div className="bg-slate-100 rounded-xl p-2">
                  <p className="text-slate-500">
                    {t.totalOut} ({r.expenses_count})
                  </p>
                  <p className="num-mono font-bold text-slate-700 mt-0.5">
                    −{fmt(r.expenses_total, r.currency, currencies)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => window.print()}
          className="w-full bg-slate-900 text-white rounded-xl py-2.5 font-bold text-sm flex items-center justify-center gap-2"
        >
          <Printer size={16} /> {t.printReport}
        </button>

        <div className="space-y-2">
          {entries.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">{t.reportEmpty}</p>
          ) : (
            entries.map((e) => (
              <LedgerRow
                key={`${e.type}-${e.id}`}
                entry={e}
                currencies={currencies}
                canEdit={canEdit}
                onPrint={setReceiptEntry}
                onEdit={setEditingEntry}
              />
            ))
          )}
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

        <h1 className="text-2xl font-black mt-6">{t.monthlyReport}</h1>
        <div className="flex justify-between text-sm text-slate-600 mt-1">
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
              <th className="text-start py-2">{lang === "ar" ? "العملة" : "Currency"}</th>
              <th className="text-start py-2">{t.openingBalance}</th>
              <th className="text-start py-2">
                {t.totalIn} ({lang === "ar" ? "عدد" : "count"})
              </th>
              <th className="text-start py-2">
                {t.totalOut} ({lang === "ar" ? "عدد" : "count"})
              </th>
              <th className="text-start py-2">{t.closingBalance}</th>
            </tr>
          </thead>
          <tbody>
            {report.map((r) => (
              <tr key={r.currency} className="border-b border-slate-200">
                <td className="py-2 font-bold">{r.currency}</td>
                <td className="py-2 num-mono">{fmt(r.opening_balance, r.currency, currencies)}</td>
                <td className="py-2 num-mono">
                  +{fmt(r.donations_total, r.currency, currencies)} ({r.donations_count})
                </td>
                <td className="py-2 num-mono">
                  −{fmt(r.expenses_total, r.currency, currencies)} ({r.expenses_count})
                </td>
                <td className="py-2 num-mono font-bold">{fmt(r.closing_balance, r.currency, currencies)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="text-lg font-black mt-8 mb-2">{t.recent}</h2>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b-2 border-slate-800">
              <th className="text-start py-1.5">#</th>
              <th className="text-start py-1.5">{lang === "ar" ? "النوع" : "Type"}</th>
              <th className="text-start py-1.5">{lang === "ar" ? "الاسم / السبب" : "Name / reason"}</th>
              <th className="text-start py-1.5">{t.amountPlaceholder}</th>
              <th className="text-start py-1.5">{lang === "ar" ? "التاريخ" : "Date"}</th>
              <th className="text-start py-1.5">{t.recordedBy}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={`${e.type}-${e.id}`} className="border-b border-slate-200">
                <td className="py-1.5 num-mono">{e.entryNo}</td>
                <td className="py-1.5">{e.type === "donation" ? t.donation : t.expense}</td>
                <td className="py-1.5">{e.personName}</td>
                <td className="py-1.5 num-mono">
                  {e.amount != null ? fmt(e.amount, e.currency, currencies) : t.hiddenAmount}
                </td>
                <td className="py-1.5 num-mono">{e.date}</td>
                <td className="py-1.5">{e.recordedByName}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="text-xs text-slate-400 mt-8 border-t border-slate-200 pt-3">{t.reportFooterNote}</p>
      </div>

      {receiptEntry && <ReceiptModal entry={receiptEntry} onClose={() => setReceiptEntry(null)} />}
      {editingEntry && <EditDonationModal entry={editingEntry} onClose={() => setEditingEntry(null)} />}
    </>
  );
}
