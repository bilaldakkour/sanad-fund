"use client";

import { useActionState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { rejectDonation, type FormActionState } from "@/app/actions/donations";

const initialState: FormActionState = { error: null };

export function RejectDonationModal({
  donationId,
  donorName,
  onClose,
}: {
  donationId: string;
  donorName: string;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [state, formAction, pending] = useActionState(rejectDonation, initialState);
  const attempted = useRef(false);

  useEffect(() => {
    if (pending) attempted.current = true;
    if (!pending && attempted.current && state.error === null) onClose();
  }, [pending, state, onClose]);

  return (
    <div className="print:hidden fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
      <form action={formAction} className="bg-white w-full max-w-lg rounded-t-3xl p-5 space-y-3">
        <input type="hidden" name="donationId" value={donationId} />
        <div className="flex items-center justify-between">
          <p className="font-bold text-slate-800">
            {t.rejectDonationTitle} — {donorName}
          </p>
          <button type="button" onClick={onClose}>
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-2">
          {t.noDeleteNote}
        </p>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">{t.rejectionReasonLabel}</label>
          <textarea
            name="reason"
            required
            rows={3}
            placeholder={t.rejectionReasonPlaceholder}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-red-500"
          />
        </div>

        {state.error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-2">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-red-600 text-white rounded-xl py-2.5 font-bold text-sm disabled:opacity-60 transition-transform duration-150 active:scale-[0.98]"
        >
          {pending ? "..." : t.confirmRejectBtn}
        </button>
      </form>
    </div>
  );
}
