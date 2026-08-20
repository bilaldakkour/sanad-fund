"use client";

import { useActionState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAppData } from "@/lib/AppDataProvider";
import { editDonation, type FormActionState } from "@/app/actions/donations";
import type { LedgerEntry } from "@/lib/types";

const initialState: FormActionState = { error: null };

export function EditDonationModal({ entry, onClose }: { entry: LedgerEntry; onClose: () => void }) {
  const { t } = useLanguage();
  const { currencies, approvedMembers } = useAppData();
  const [state, formAction, pending] = useActionState(editDonation, initialState);
  const attempted = useRef(false);

  useEffect(() => {
    if (pending) attempted.current = true;
    if (!pending && attempted.current && state.error === null) onClose();
  }, [pending, state, onClose]);

  return (
    <div className="print:hidden fixed inset-0 bg-black/40 z-40 flex items-end justify-center">
      <form action={formAction} className="bg-white w-full max-w-lg rounded-t-3xl p-5 space-y-3">
        <input type="hidden" name="id" value={entry.id} />
        <div className="flex items-center justify-between">
          <p className="font-bold text-slate-800">{t.editDonation}</p>
          <button type="button" onClick={onClose}>
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-2">
          {t.noDeleteNote}
        </p>

        <select
          name="memberId"
          required
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500"
        >
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
            defaultValue={entry.amount ?? undefined}
            placeholder={t.amountPlaceholder}
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500"
          />
          <select
            name="currency"
            defaultValue={entry.currency}
            className="border border-slate-200 rounded-xl px-2 text-sm"
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
        </div>

        <input
          name="note"
          defaultValue={entry.note === "—" ? "" : entry.note}
          placeholder={t.notePlaceholder}
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500"
        />

        {state.error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-2">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-orange-600 text-white rounded-xl py-2.5 font-bold text-sm disabled:opacity-60"
        >
          {pending ? "..." : t.saveEdit}
        </button>
      </form>
    </div>
  );
}
