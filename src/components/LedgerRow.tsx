"use client";

import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, History, Lock, Pencil, Printer } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { fmt, receiptNo } from "@/lib/format";
import { EditHistoryModal } from "@/components/modals/EditHistoryModal";
import type { Currency, LedgerEntry } from "@/lib/types";

export function LedgerRow({
  entry,
  currencies,
  canEdit,
  onPrint,
  onEdit,
}: {
  entry: LedgerEntry;
  currencies: Currency[];
  canEdit: boolean;
  onPrint: (entry: LedgerEntry) => void;
  onEdit: (entry: LedgerEntry) => void;
}) {
  const { t } = useLanguage();
  const isDonation = entry.type === "donation";
  const canSeeAmount = entry.amount !== null;
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div
      className={`bg-white rounded-2xl p-3 shadow-sm border-e-4 ${isDonation ? "border-orange-500" : "border-slate-500"}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isDonation ? "bg-orange-50 text-orange-600" : "bg-slate-100 text-slate-600"}`}
        >
          {isDonation ? <ArrowDownCircle size={20} /> : <ArrowUpCircle size={20} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-slate-800 text-sm truncate">{entry.personName}</p>
            {canSeeAmount ? (
              <p
                className={`font-mono font-bold text-sm num-mono ${isDonation ? "text-orange-600" : "text-slate-700"}`}
              >
                {isDonation ? "+" : "−"}
                {fmt(entry.amount!, entry.currency, currencies)}
              </p>
            ) : (
              <p className="flex items-center gap-1 text-slate-300 text-xs">
                <Lock size={11} /> {t.hiddenAmount}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p className="text-xs text-slate-400">{entry.note}</p>
            <p className="text-[11px] text-slate-400 num-mono">#{receiptNo(entry.entryNo)}</p>
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p className="text-[11px] text-slate-300">
              {t.recordedBy} {entry.recordedByName}
            </p>
            <p className="text-[11px] text-slate-300">{entry.date}</p>
          </div>
        </div>
      </div>

      {!isDonation && entry.status === "pending" && (
        <span className="mt-2 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
          {t.pendingApproval}
        </span>
      )}

      {!isDonation && entry.status === "approved" && entry.balanceAfter != null && (
        <div className="mt-2 flex items-center justify-between text-[11px] bg-slate-50 rounded-xl px-2 py-1.5">
          <span className="text-slate-400">
            {t.balanceBefore}:{" "}
            <span className="num-mono font-bold text-slate-600">
              {fmt(entry.balanceBefore ?? 0, entry.currency, currencies)}
            </span>
          </span>
          <span className="text-slate-400">
            {t.balanceAfter}:{" "}
            <span className="num-mono font-bold text-slate-700">
              {fmt(entry.balanceAfter ?? 0, entry.currency, currencies)}
            </span>
          </span>
        </div>
      )}

      {isDonation && entry.edited && (
        <button
          onClick={() => setShowHistory(true)}
          className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
        >
          <History size={10} /> {t.editedBadge} · {entry.editedAt} · {t.viewHistory}
        </button>
      )}

      {isDonation && (
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={() => onPrint(entry)}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-orange-600"
          >
            <Printer size={12} /> {t.printReceipt}
          </button>
          {canEdit && (
            <button
              onClick={() => onEdit(entry)}
              className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-orange-600"
            >
              <Pencil size={12} /> {t.editEntry}
            </button>
          )}
        </div>
      )}

      {showHistory && <EditHistoryModal donationId={entry.id} onClose={() => setShowHistory(false)} />}
    </div>
  );
}
