"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, Clock, HeartHandshake, LifeBuoy, TrendingDown, TrendingUp, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAppData } from "@/lib/AppDataProvider";
import { fmt, monthLabel } from "@/lib/format";
import { LedgerRow } from "@/components/LedgerRow";
import { BrandRings } from "@/components/BrandRings";
import { GrowthChart } from "@/components/charts/GrowthChart";
import { ReceiptModal } from "@/components/modals/ReceiptModal";
import { EditDonationModal } from "@/components/modals/EditDonationModal";
import type { LedgerEntry } from "@/lib/types";

interface Balance {
  currency: string;
  balance: number;
}

export function HomeClient({
  balances,
  recentEntries,
  myDonationCount,
  approvedMembersCount,
  openCasesCount,
  chartData,
}: {
  balances: Balance[];
  recentEntries: LedgerEntry[];
  myDonationCount: number;
  approvedMembersCount: number;
  openCasesCount: number;
  chartData: { month_start: string; total: number }[];
}) {
  const { t, lang, dir } = useLanguage();
  const { currencies, profile } = useAppData();
  const [receiptEntry, setReceiptEntry] = useState<LedgerEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);

  const canEdit = ["admin", "treasurer", "collector"].includes(profile.role);

  const chart = useMemo(
    () =>
      chartData.map((row) => {
        const monthIdx = new Date(row.month_start).getUTCMonth();
        return { label: monthLabel(monthIdx, lang), value: row.total };
      }),
    [chartData, lang],
  );

  const monthGrowth = useMemo(() => {
    if (chart.length < 2) return { amount: 0, pct: 0, up: true };
    const last = chart[chart.length - 1].value;
    const prev = chart[chart.length - 2].value;
    const pct = prev === 0 ? 0 : ((last - prev) / prev) * 100;
    return { amount: last - prev, pct, up: pct >= 0 };
  }, [chart]);

  return (
    <>
      <div className="space-y-4 print:hidden">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-950 text-white rounded-3xl p-6 shadow-xl shadow-slate-900/20 ring-1 ring-white/5">
        <div className="absolute -left-8 -top-10 w-36 h-36 rounded-full bg-orange-600/20 blur-2xl" />
        <div className="absolute -right-10 -bottom-14 w-40 h-40 rounded-full bg-orange-500/10 blur-2xl" />
        <BrandRings className="absolute -end-10 -bottom-12 w-56 h-56 text-orange-400/[0.14] rotate-[8deg]" />
        <p className="text-orange-300 text-xs relative font-bold tracking-wide">{t.balance}</p>
        <div className="relative mt-3 space-y-2">
          {balances.map((b) => (
            <div
              key={b.currency}
              className="flex items-baseline justify-between border-b border-white/10 pb-2 last:border-0"
            >
              <span className="text-slate-400 text-xs font-bold">{b.currency}</span>
              <span className="num-mono text-5xl font-black tracking-tight">{fmt(b.balance, b.currency, currencies)}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-4 relative">
          <Clock size={12} /> {t.lastUpdate}
        </div>
      </div>

      <Link
        href="/donate"
        className="flex items-center justify-center gap-2 bg-orange-600 text-white rounded-2xl py-3.5 font-bold text-sm shadow-lg shadow-orange-600/25 transition-transform duration-150 active:scale-[0.98]"
      >
        <HeartHandshake size={18} /> {t.donateNow}
      </Link>

      <div className="relative overflow-hidden bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-900/5 transition-shadow duration-200 hover:shadow-md">
        <div className="absolute -end-8 -top-10 w-28 h-28 rounded-full bg-orange-50" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/25 shrink-0">
              <Wallet size={19} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-400 font-bold">{t.thisMonth}</p>
              <p className="num-mono font-black text-2xl text-slate-800 tracking-tight truncate">
                ${monthGrowth.amount.toLocaleString("en-US")}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <div
              className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl ${monthGrowth.up ? "bg-orange-50 text-orange-600" : "bg-slate-100 text-slate-500"}`}
            >
              {monthGrowth.up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {Math.abs(monthGrowth.pct).toFixed(1)}%
            </div>
            <span className="text-[10px] text-slate-400">{t.vsLastMonth}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm ring-1 ring-slate-900/5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto shadow-sm shadow-orange-600/25">
            <Wallet size={16} className="text-white" />
          </div>
          <p className="num-mono font-black text-base text-slate-800 mt-2">{myDonationCount}</p>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5">{t.myDonations}</p>
        </div>
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm ring-1 ring-slate-900/5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center mx-auto shadow-sm shadow-slate-900/20">
            <Users size={16} className="text-white" />
          </div>
          <p className="num-mono font-black text-base text-slate-800 mt-2">{approvedMembersCount}</p>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5">{t.approvedMembers}</p>
        </div>
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm ring-1 ring-slate-900/5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto shadow-sm shadow-amber-600/25">
            <LifeBuoy size={16} className="text-white" />
          </div>
          <p className="num-mono font-black text-base text-slate-800 mt-2">{openCasesCount}</p>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5">{t.openCases}</p>
        </div>
      </div>

      <div className="relative overflow-hidden bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-900/5">
        <div className="absolute -start-10 -top-12 w-32 h-32 rounded-full bg-orange-50/70" />
        <div className="relative flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shrink-0 shadow-sm shadow-orange-600/25">
              <TrendingUp size={16} className="text-white" />
            </span>
            <div>
              <p className="text-slate-800 text-xs font-bold">{t.chartTitle}</p>
              <p className="text-slate-400 text-[10px]">{t.chartSubtitle}</p>
            </div>
          </div>
          {chart.length > 0 && (
            <div className="text-end shrink-0">
              <p className="num-mono font-black text-xl text-slate-800 leading-none">
                ${chart[chart.length - 1].value.toLocaleString("en-US")}
              </p>
              <div
                className={`inline-flex items-center gap-0.5 text-[10px] font-bold mt-1 px-1.5 py-0.5 rounded-md ${monthGrowth.up ? "bg-orange-50 text-orange-600" : "bg-slate-100 text-slate-500"}`}
              >
                {monthGrowth.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {Math.abs(monthGrowth.pct).toFixed(1)}%
              </div>
            </div>
          )}
        </div>
        <div className="relative">
          <GrowthChart data={chart} rtl={dir === "rtl"} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="font-bold text-slate-700 text-sm">{t.recent}</p>
          <Link href="/ledger" className="text-orange-600 text-xs font-bold flex items-center">
            {t.viewAll} <ChevronLeft size={14} className={lang === "en" ? "rotate-180" : ""} />
          </Link>
        </div>
        <div className="space-y-2">
          {recentEntries.map((e) => (
            <LedgerRow
              key={`${e.type}-${e.id}`}
              entry={e}
              currencies={currencies}
              canEdit={canEdit}
              onPrint={setReceiptEntry}
              onEdit={setEditingEntry}
            />
          ))}
        </div>
      </div>
      </div>

      {receiptEntry && <ReceiptModal entry={receiptEntry} onClose={() => setReceiptEntry(null)} />}
      {editingEntry && <EditDonationModal entry={editingEntry} onClose={() => setEditingEntry(null)} />}
    </>
  );
}
