"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { LifeBuoy, Plus, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAppData } from "@/lib/AppDataProvider";
import { fmt } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import { addCase, closeCase } from "@/app/actions/cases";
import type { FormActionState } from "@/app/actions/donations";
import type { EmergencyCase } from "@/lib/types";

const initialState: FormActionState = { error: null };

export function CasesClient({ cases }: { cases: EmergencyCase[] }) {
  const { t, lang } = useLanguage();
  const { currencies, profile } = useAppData();
  const [showAdd, setShowAdd] = useState(false);
  const isAdmin = profile.role === "admin";

  return (
    <div className="space-y-3 print:hidden">
      {cases.length === 0 && <EmptyState icon={LifeBuoy} title={t.casesEmpty} />}
      {cases.map((c) => {
        const pct = c.target_amount ? Math.min(100, Math.round((c.raised_amount / c.target_amount) * 100)) : 0;
        return (
          <div
            key={c.id}
            className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-900/5 border-e-4 border-amber-500 transition-shadow duration-200 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-slate-800 text-sm">{c.title}</p>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === "open" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}
              >
                {c.status === "open" ? t.open : t.closed}
              </span>
            </div>
            {c.description && <p className="text-xs text-slate-400 mt-1">{c.description}</p>}
            {c.target_amount != null && (
              <>
                <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs num-mono">
                  <span className="text-amber-600 font-bold">{fmt(c.raised_amount, c.currency, currencies)}</span>
                  <span className="text-slate-400">
                    {t.target} {fmt(c.target_amount, c.currency, currencies)}
                  </span>
                </div>
              </>
            )}
            {isAdmin && c.status === "open" && (
              <button
                type="button"
                onClick={() => closeCase(c.id)}
                className="mt-3 text-[11px] font-bold text-slate-400 hover:text-amber-600 transition-colors"
              >
                {lang === "ar" ? "إقفال الحالة" : "Close case"}
              </button>
            )}
          </div>
        );
      })}

      {isAdmin && (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="print:hidden fixed bottom-20 left-1/2 -translate-x-1/2 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-amber-600/30 z-30 transition-transform duration-150 active:scale-90"
        >
          <Plus size={22} />
        </button>
      )}

      {showAdd && <AddCaseModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function AddCaseModal({ onClose }: { onClose: () => void }) {
  const { t, lang } = useLanguage();
  const { currencies } = useAppData();
  const [state, formAction, pending] = useActionState(addCase, initialState);
  const attempted = useRef(false);

  useEffect(() => {
    if (pending) attempted.current = true;
    if (!pending && attempted.current && state.error === null) onClose();
  }, [pending, state, onClose]);

  return (
    <div className="print:hidden fixed inset-0 bg-black/40 z-40 flex items-end justify-center">
      <form action={formAction} className="bg-white w-full max-w-lg rounded-t-3xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-bold text-slate-800">{lang === "ar" ? "حالة طارئة جديدة" : "New emergency case"}</p>
          <button type="button" onClick={onClose}>
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        <input
          name="title"
          required
          placeholder={t.namePlaceholder}
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-orange-500"
        />
        <input
          name="description"
          placeholder={t.notePlaceholder}
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-orange-500"
        />
        <div className="flex gap-2">
          <input
            name="targetAmount"
            type="number"
            step="0.01"
            placeholder={t.amountPlaceholder}
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-orange-500"
          />
          <select name="currency" defaultValue={currencies[0]?.code} className="border border-slate-200 rounded-xl px-2 text-sm">
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
        </div>
        {state.error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-2">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl py-2.5 font-bold text-sm disabled:opacity-60 transition-transform duration-150 active:scale-[0.98]"
        >
          {pending ? "..." : t.save}
        </button>
      </form>
    </div>
  );
}
