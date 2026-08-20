"use client";

import { useTransition } from "react";
import { ClipboardCheck } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAppData } from "@/lib/AppDataProvider";
import { fmt, receiptNo } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import { approveExpense } from "@/app/actions/expenses";
import type { ExpenseFeedRow } from "@/lib/ledger";

export function ApprovalsClient({ expenses }: { expenses: ExpenseFeedRow[] }) {
  const { t } = useLanguage();
  const { currencies, profile } = useAppData();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3 print:hidden">
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
  );
}
