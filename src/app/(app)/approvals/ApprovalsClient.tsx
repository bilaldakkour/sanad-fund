"use client";

import { useEffect, useState, useTransition } from "react";
import { CheckCircle2, ClipboardCheck, HandCoins, ImageIcon, Printer, XCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAppData } from "@/lib/AppDataProvider";
import { useHighlightParam } from "@/lib/useHighlightParam";
import { fmt, receiptNo } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import { Logo } from "@/components/Logo";
import { approveExpense } from "@/app/actions/expenses";
import { confirmDonation } from "@/app/actions/donations";
import { confirmHandover } from "@/app/actions/handover";
import { RejectDonationModal } from "@/components/modals/RejectDonationModal";
import type { DonationFeedRow, ExpenseFeedRow } from "@/lib/ledger";
import type { HandoverDonation } from "../handover/page";

export interface PendingHandoverBatch {
  id: string;
  collector_name: string;
  created_at: string;
  totals: { currency: string; amount: number }[];
  count: number;
  donations: HandoverDonation[];
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
  const { t, lang, dir } = useLanguage();
  const { currencies, settings, profile } = useAppData();
  const [isPending, startTransition] = useTransition();
  const highlighted = useHighlightParam();
  const [rejectingDonation, setRejectingDonation] = useState<DonationFeedRow | null>(null);
  const [printingBatch, setPrintingBatch] = useState<PendingHandoverBatch | null>(null);
  // تأكيد التبرعات والتسليمات محصور بأمين الصندوق حصرًا — حتى المدير ما يقدر يأكدها.
  const canConfirm = profile.role === "treasurer";

  useEffect(() => {
    if (printingBatch) window.print();
  }, [printingBatch]);

  return (
    <>
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

            <div className="space-y-1">
              {b.donations.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-2 text-[11px] bg-slate-50 rounded-lg px-2 py-1.5">
                  <span className="text-slate-600 truncate">
                    {d.member_name} <span className="text-slate-300">#{receiptNo(d.entry_no)}</span>
                  </span>
                  <span className="num-mono font-bold text-slate-700 shrink-0">{fmt(d.amount, d.currency, currencies)}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                disabled={isPending || !canConfirm}
                onClick={() => startTransition(() => confirmHandover(b.id))}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl border bg-orange-600 text-white border-orange-600 disabled:opacity-40 transition-transform duration-150 active:scale-95"
              >
                <CheckCircle2 size={14} /> {t.confirmHandoverBtn}
              </button>
              <button
                onClick={() => setPrintingBatch(b)}
                className="flex items-center justify-center gap-1.5 text-xs font-bold py-2 px-3 rounded-xl border bg-white text-slate-600 border-slate-200 transition-transform duration-150 active:scale-95"
              >
                <Printer size={14} /> {t.printReport}
              </button>
            </div>
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
            <div className="flex gap-2">
              <button
                disabled={isPending || !canConfirm}
                onClick={() => startTransition(() => confirmDonation(d.id))}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl border bg-orange-600 text-white border-orange-600 disabled:opacity-40 transition-transform duration-150 active:scale-95"
              >
                <CheckCircle2 size={14} /> {t.confirmDonationBtn}
              </button>
              <button
                disabled={isPending || !canConfirm}
                onClick={() => setRejectingDonation(d)}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl border bg-white text-red-600 border-red-200 disabled:opacity-40 transition-transform duration-150 active:scale-95"
              >
                <XCircle size={14} /> {t.rejectDonationBtn}
              </button>
            </div>
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

      {rejectingDonation && (
        <RejectDonationModal
          donationId={rejectingDonation.id}
          donorName={rejectingDonation.member_name}
          onClose={() => setRejectingDonation(null)}
        />
      )}
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
        <h1 className="text-2xl font-black mt-6">{t.handoverReceivedSlipTitle}</h1>
        <div className="flex justify-between text-sm text-slate-600 mt-1">
          <p>
            {t.collectorName}: <span className="font-bold">{printingBatch.collector_name}</span>
          </p>
          <p>
            {t.receivedByLabel} <span className="font-bold">{profile.full_name}</span>
          </p>
        </div>
        <p className="text-sm text-slate-600 mt-1">
          {lang === "ar" ? "التاريخ" : "Date"}: <span className="font-bold num-mono">{printingBatch.created_at}</span>
        </p>
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
