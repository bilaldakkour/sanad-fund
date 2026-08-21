"use client";

import { useActionState, useEffect, useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { updatePaymentMethod } from "@/app/actions/settings";
import { paymentMethodIconUrl } from "@/lib/format";
import type { FormActionState } from "@/app/actions/donations";
import type { PaymentMethod } from "@/lib/types";

const initialState: FormActionState = { error: null };

export function EditPaymentMethodModal({ method, onClose }: { method: PaymentMethod; onClose: () => void }) {
  const { t } = useLanguage();
  const [state, formAction, pending] = useActionState(updatePaymentMethod, initialState);
  const attempted = useRef(false);
  const iconUrl = paymentMethodIconUrl(method.icon_path);

  useEffect(() => {
    if (pending) attempted.current = true;
    if (!pending && attempted.current && state.error === null) onClose();
  }, [pending, state, onClose]);

  return (
    <div className="print:hidden fixed inset-0 bg-black/40 z-40 flex items-end justify-center">
      <form action={formAction} className="bg-white w-full max-w-lg rounded-t-3xl p-5 space-y-3 max-h-[90vh] overflow-y-auto">
        <input type="hidden" name="code" value={method.code} />
        <div className="flex items-center justify-between">
          <p className="font-bold text-slate-800">{t.editPaymentMethodTitle}</p>
          <button type="button" onClick={onClose}>
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label className="w-14 h-14 rounded-xl bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:border-orange-400 transition-colors duration-150">
            {iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={iconUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <ImagePlus size={18} className="text-slate-300" />
            )}
            <input name="icon" type="file" accept="image/*" className="hidden" />
          </label>
          <p className="text-[11px] text-slate-400 flex-1">{t.keepCurrentIcon}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            name="nameAr"
            required
            defaultValue={method.name_ar}
            placeholder={t.paymentMethodNameArPlaceholder}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-orange-500"
          />
          <input
            name="nameEn"
            required
            defaultValue={method.name_en}
            placeholder={t.paymentMethodNameEnPlaceholder}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-orange-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            name="accountNumber"
            defaultValue={method.account_number ?? ""}
            placeholder={t.paymentMethodAccountNumberPlaceholder}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-orange-500"
          />
          <input
            name="feePercent"
            type="number"
            step="0.1"
            min="0"
            max="99"
            defaultValue={method.fee_percent}
            placeholder={t.paymentMethodFeePlaceholder}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-orange-500"
          />
        </div>

        <textarea
          name="instructionsAr"
          rows={2}
          defaultValue={method.instructions_ar ?? ""}
          placeholder={t.paymentMethodInstructionsArPlaceholder}
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-orange-500"
        />
        <textarea
          name="instructionsEn"
          rows={2}
          defaultValue={method.instructions_en ?? ""}
          placeholder={t.paymentMethodInstructionsEnPlaceholder}
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-orange-500"
        />

        {state.error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-2">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-orange-600 text-white rounded-xl py-2.5 font-bold text-sm disabled:opacity-60 transition-transform duration-150 active:scale-[0.98]"
        >
          {pending ? "..." : t.saveEdit}
        </button>
      </form>
    </div>
  );
}
