"use client";

import { useTransition } from "react";
import { CheckCircle2, ClipboardCheck, HandCoins, ImageIcon } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAppData } from "@/lib/AppDataProvider";
import { useHighlightParam } from "@/lib/useHighlightParam";
import { fmt, receiptNo } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import { approveExpense } from "@/app/actions/expenses";
import { confirmDonation } from "@/app/actions/donations";
import { confirmHandover } from "@/app/actions/handover";
import type { DonationFeedRow, ExpenseFeedRow } from "@/lib/ledger";

export interface PendingHandoverBatch {
  id: string;
  collector_name: string;
  created_at: string;
  totals: { currency: string; amount: number }[];
  count: number;
}

export function ApprovalsClient({
  expenses,
  donations,
  handoverBatches,
}: {
  expenses: ExpenseFeedRow[];
  donations: (DonationFeedRow & { proofImageUrl: string | null })[];
  handoverBatches: PendingHandoverBatch[];
}) {
  const { t, lang } = useLanguage();
  const { currencies, profile } = useAppData();
  const [isPending, startTransition] = useTransition();
  const highlighted = useHighlightParam();
  // تأكيد التبرعات والتسليمات محصور بأمين الصندوق حصرًا — حتى المدير ما يقدر يأكدها.
  const canConfirm = profile.role === "treasurer";

  return (
    <div className="space-y-6 print:hidden">
      <div className="space-y-3">
        <p className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
          <HandCoins size={15} className="text-orange-600" /> {t.pendingHandoversApprovalTitle}
        </p>
        {handoverBatches.length === 0 && <EmptyState icon={HandCoins} title={t.noPendingHandovers} />}
        {handoverBatches.map((b) => (
          <div
            key={b.id}
            id={`entry-${b.id}`}
            className={`bg-white rounded-2xl p-4 shadow-sm space-y-2 transition-all duration-500 ${
              highlighted === b.id ? "ring-2 ring-orange-400 shadow-lg" : "hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-slate-800 text-sm">
                {t.handoverFrom} {b.collector_name}
              </p>
              <p className="text-xs text-slate-400">{b.created_at}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {b.totals.map((tot) => (
                <span key={tot.currency} className="num-mono text-sm font-bold bg-slate-50 text-slate-700 px-3 py-1 rounded-lg">
                  {fmt(tot.amount, tot.currency, currencies)}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              {b.count} {lang === "ar" ? "حركة" : "entries"}
            </p>
            <button
              disabled={isPending || !canConfirm}
              onClick={() => startTransition(() => confirmHandover(b.id))}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl border bg-orange-600 text-white border-orange-600 disabled:opacity-40 transition-transform duration-150 active:scale-95"
            >
              <CheckCircle2 size={14} /> {t.confirmHandoverBtn}
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <p className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
          <HandCoins size={15} className="text-orange-600" /> {t.pendingDonationsApprovalTitle}
        </p>
        {donations.length === 0 && <EmptyState icon={HandCoins} title={t.noPendingDonations} />}
        {donations.map((d) => (
          <div
            key={d.id}
            id={`entry-${d.id}`}
            className={`bg-white rounded-2xl p-4 shadow-sm space-y-2 transition-all duration-500 ${
              highlighted === d.id ? "ring-2 ring-orange-400 shadow-lg" : "hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-slate-800 text-sm">{d.member_name}</p>
              <p className="num-mono font-bold text-slate-700 text-sm">
                {d.amount != null ? fmt(d.amount, d.currency, currencies) : t.hiddenAmount}
              </p>
            </div>
            {(lang === "ar" ? d.payment_method_name_ar : d.payment_method_name_en) && (
              <p className="text-xs text-slate-400">
                {t.viaPaymentMethod} {lang === "ar" ? d.payment_method_name_ar : d.payment_method_name_en}
              </p>
            )}
            {d.gross_amount != null && d.amount != null && d.gross_amount !== d.amount && (
              <p className="text-xs text-slate-400">
                {t.transferredGrossLabel}{" "}
                <span className="num-mono font-bold text-slate-600">{fmt(d.gross_amount, d.currency, currencies)}</span>
                {" · "}
                {t.netToFundLabel}{" "}
                <span className="num-mono font-bold text-orange-600">{fmt(d.amount, d.currency, currencies)}</span>
              </p>
            )}
            {d.payment_reference && (
              <p className="text-xs text-slate-400">
                {t.paymentReferenceLabel} <span className="num-mono">{d.payment_reference}</span>
              </p>
            )}
            <p className="text-[11px] text-slate-300">
              #{receiptNo(d.entry_no)} · {d.donated_at.slice(0, 10)}
            </p>
            {d.proofImageUrl && (
              <a
                href={d.proofImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl overflow-hidden border border-slate-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.proofImageUrl} alt={t.viewProofImage} className="w-full max-h-48 object-cover" />
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 px-2 py-1.5 bg-slate-50">
                  <ImageIcon size={12} /> {t.viewProofImage}
                </span>
              </a>
            )}
            <button
              disabled={isPending || !canConfirm}
              onClick={() => startTransition(() => confirmDonation(d.id))}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl border bg-orange-600 text-white border-orange-600 disabled:opacity-40 transition-transform duration-150 active:scale-95"
            >
              <CheckCircle2 size={14} /> {t.confirmDonationBtn}
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <p className="font-bold text-slate-700 text-sm">{t.approvalsTitle}</p>
        {expenses.length === 0 && <EmptyState icon={ClipboardCheck} title={t.approvalsEmpty} />}
        {expenses.map((e) => (
          <div key={e.id} className="bg-white rounded-2xl p-4 shadow-sm space-y-2 transition-shadow duration-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="font-bold text-slate-800 text-sm">{e.title}</p>
              <p className="num-mono font-bold text-slate-700 text-sm">{fmt(e.amount, e.currency, currencies)}</p>
            </div>
            <p className="text-xs text-slate-400">
              {e.reason || "—"} · #{receiptNo(e.entry_no)}
            </p>
            <p className="text-[11px] text-slate-300">
              {t.createdBy} {e.recorded_by_name}
            </p>
            <div className="flex gap-2 pt-1">
              <button
                disabled={isPending || !(profile.role === "treasurer" || profile.role === "admin")}
                onClick={() => startTransition(() => approveExpense(e.id, "treasurer"))}
                className={`flex-1 text-xs font-bold py-2 rounded-xl border transition-all duration-150 active:scale-95 ${e.treasurer_approved ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-white text-slate-600 border-slate-200"} disabled:opacity-40`}
              >
                {e.treasurer_approved ? t.approvedTag : t.treasurerApproval}
              </button>
              <button
                disabled={isPending || !(profile.role === "supervisor" || profile.role === "admin")}
                onClick={() => startTransition(() => approveExpense(e.id, "supervisor"))}
                className={`flex-1 text-xs font-bold py-2 rounded-xl border transition-all duration-150 active:scale-95 ${e.supervisor_approved ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-white text-slate-600 border-slate-200"} disabled:opacity-40`}
              >
                {e.supervisor_approved ? t.approvedTag : t.supervisorApproval}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
