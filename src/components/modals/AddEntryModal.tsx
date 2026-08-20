"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAppData } from "@/lib/AppDataProvider";
import { addDonation, type FormActionState } from "@/app/actions/donations";
import { addExpense } from "@/app/actions/expenses";

const initialState: FormActionState = { error: null };

export function AddEntryModal({
  canAddExpense,
  onClose,
}: {
  canAddExpense: boolean;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const { currencies, approvedMembers } = useAppData();
  const [type, setType] = useState<"donation" | "expense">("donation");

  const [donationState, donationAction, donationPending] = useActionState(addDonation, initialState);
  const [expenseState, expenseAction, expensePending] = useActionState(addExpense, initialState);

  const attempted = useRef(false);
  const pending = type === "donation" ? donationPending : expensePending;
  const state = type === "donation" ? donationState : expenseState;

  useEffect(() => {
    if (pending) attempted.current = true;
    if (!pending && attempted.current && state.error === null) onClose();
  }, [pending, state, onClose]);

  return (
    <div className="print:hidden fixed inset-0 bg-black/40 z-40 flex items-end justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-3xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-bold text-slate-800">{t.addEntry}</p>
          <button onClick={onClose}>
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {canAddExpense && (
          <div className="flex gap-2">
            {(["donation", "expense"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setType(k)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold border ${type === k ? "bg-slate-900 text-white border-slate-900" : "border-slate-200 text-slate-600"}`}
              >
                {k === "donation" ? t.donation : t.expense}
              </button>
            ))}
          </div>
        )}

        {type === "expense" && (
          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2">
            {t.expenseAdminOnly}
          </p>
        )}

        {type === "donation" ? (
          <form action={donationAction} className="space-y-3">
            <select
              name="memberId"
              required
              defaultValue=""
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-orange-500"
            >
              <option value="" disabled>
                {t.namePlaceholder}
              </option>
              {approvedMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                name="amount"
                type="number"
                step="0.01"
                required
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
            <input
              name="note"
              placeholder={t.notePlaceholder}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-orange-500"
            />
            {donationState.error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-2">
                {donationState.error}
              </p>
            )}
            <button
              type="submit"
              disabled={donationPending}
              className="w-full bg-orange-600 text-white rounded-xl py-2.5 font-bold text-sm disabled:opacity-60 transition-transform duration-150 active:scale-[0.98]"
            >
              {donationPending ? "..." : t.save}
            </button>
          </form>
        ) : (
          <form action={expenseAction} className="space-y-3">
            <input
              name="title"
              required
              placeholder={t.namePlaceholder}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-orange-500"
            />
            <div className="flex gap-2">
              <input
                name="amount"
                type="number"
                step="0.01"
                required
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
            <input
              name="reason"
              placeholder={t.notePlaceholder}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-orange-500"
            />
            {expenseState.error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-2">
                {expenseState.error}
              </p>
            )}
            <button
              type="submit"
              disabled={expensePending}
              className="w-full bg-orange-600 text-white rounded-xl py-2.5 font-bold text-sm disabled:opacity-60 transition-transform duration-150 active:scale-[0.98]"
            >
              {expensePending ? "..." : t.save}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
