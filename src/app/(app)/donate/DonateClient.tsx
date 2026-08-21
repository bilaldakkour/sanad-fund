"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check, Copy, HandCoins, HeartHandshake, Info } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAppData } from "@/lib/AppDataProvider";
import { submitMemberDonation } from "@/app/actions/donations";
import { fmt, paymentMethodIconUrl } from "@/lib/format";
import type { FormActionState } from "@/app/actions/donations";

const initialState: FormActionState = { error: null };

export function DonateClient() {
  const { t, lang } = useLanguage();
  const { currencies, paymentMethods } = useAppData();
  const activeMethods = useMemo(() => paymentMethods.filter((m) => m.is_active), [paymentMethods]);
  const [selectedCode, setSelectedCode] = useState(activeMethods[0]?.code ?? "");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(currencies[0]?.code ?? "USD");
  const [reference, setReference] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [state, formAction, pending] = useActionState(submitMemberDonation, initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedMethod = activeMethods.find((m) => m.code === selectedCode);
  const isCollector = selectedCode === "collector";
  const feePercent = selectedMethod?.fee_percent ?? 0;
  const netAmount = feePercent > 0 && amount ? Number(amount) * (1 - feePercent / 100) : null;
  const attempted = useRef(false);

  function copyAccountNumber(value: string) {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  useEffect(() => {
    if (pending) attempted.current = true;
    if (!pending && attempted.current && state.error === null) {
      attempted.current = false;
      setSubmitted(true);
    }
  }, [pending, state]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setImageError(null);
    if (!file) {
      setImagePreview(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError(t.proofImageTooBig);
      e.target.value = "";
      setImagePreview(null);
      return;
    }
    setImagePreview(URL.createObjectURL(file));
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-6">
        <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
          <Check size={30} />
        </div>
        <p className="font-bold text-slate-800">{t.donationSubmitted}</p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setAmount("");
            setReference("");
            setImagePreview(null);
            setImageError(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
          className="mt-6 bg-slate-900 text-white rounded-xl px-5 py-2.5 font-bold text-sm transition-transform duration-150 active:scale-[0.98]"
        >
          {t.donateAnother}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="font-black text-slate-800 text-lg flex items-center gap-2">
          <HeartHandshake size={20} className="text-orange-600" /> {t.donatePageTitle}
        </p>
        <p className="text-slate-400 text-xs mt-0.5">{t.donatePageSubtitle}</p>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
        <div className="flex gap-2">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            step="0.01"
            min="0"
            placeholder={t.amountPlaceholder}
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors duration-150 focus:border-orange-500"
          />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="border border-slate-200 rounded-xl px-2 text-sm"
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-500">{t.selectPaymentMethod}</p>
        {activeMethods.map((m) => {
          const active = m.code === selectedCode;
          const iconUrl = paymentMethodIconUrl(m.icon_path);
          return (
            <button
              key={m.code}
              type="button"
              onClick={() => setSelectedCode(m.code)}
              className={`w-full flex items-center gap-3 rounded-2xl p-3 border text-start transition-colors duration-150 ${
                active ? "bg-orange-50 border-orange-300" : "bg-white border-slate-200"
              }`}
            >
              <span
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${
                  active ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-500"
                }`}
              >
                {iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={iconUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <HandCoins size={16} />
                )}
              </span>
              <span className="font-bold text-sm text-slate-700 flex-1">
                {lang === "ar" ? m.name_ar : m.name_en}
              </span>
              {m.fee_percent > 0 && (
                <span className="text-[10px] font-bold text-orange-600 shrink-0">{t.feeLabel} {m.fee_percent}%</span>
              )}
            </button>
          );
        })}
      </div>

      {selectedMethod && isCollector && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-start gap-2 text-xs text-slate-600">
          <Info size={14} className="shrink-0 mt-0.5" />
          <p>{lang === "ar" ? "الجابي رح يمر عليك ويقبض المبلغ نقدًا — ما تحتاج ترسل شي هلق." : "The collector will come by to collect the cash from you in person — no need to submit anything now."}</p>
        </div>
      )}

      {selectedMethod && !isCollector && (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="amount" value={amount} />
          <input type="hidden" name="currency" value={currency} />
          <input type="hidden" name="paymentMethodCode" value={selectedCode} />

          {(lang === "ar" ? selectedMethod.instructions_ar : selectedMethod.instructions_en) && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 text-xs text-orange-800 whitespace-pre-wrap">
              <p className="font-bold mb-1">{t.paymentInstructions}</p>
              {lang === "ar" ? selectedMethod.instructions_ar : selectedMethod.instructions_en}
            </div>
          )}

          {selectedMethod.account_number && (
            <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-3">
              <div className="min-w-0">
                <p className="text-[11px] text-slate-400">{t.accountNumberLabel}</p>
                <p className="num-mono font-bold text-slate-800 text-sm truncate">{selectedMethod.account_number}</p>
              </div>
              <button
                type="button"
                onClick={() => copyAccountNumber(selectedMethod.account_number!)}
                className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-2.5 py-1.5"
              >
                <Copy size={12} /> {copied ? t.copiedMsg : t.copyNumber}
              </button>
            </div>
          )}

          {feePercent > 0 && (
            <p className="text-[11px] text-orange-700 bg-orange-50 border border-orange-200 rounded-xl p-2">
              {t.feeDeductionNote} {feePercent}%
              {netAmount != null && (
                <>
                  {" "}
                  — {t.netToFundLabel} {fmt(netAmount, currency, currencies)}
                </>
              )}
            </p>
          )}

          <input
            name="reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder={t.paymentReferencePlaceholder}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors duration-150 focus:border-orange-500"
          />

          <div>
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1 mb-1.5">
              <Camera size={13} /> {t.attachProofImage} <span className="text-red-500">*</span>
            </label>
            <p className="text-[11px] text-slate-400 mb-1.5">{t.proofImageRequiredNote}</p>
            {/* الحقل نفسه لازم يضل موجود بالـ DOM دايمًا (حتى لما يبين preview)
                كرمال ما يضيع الملف المختار وقت الإرسال. */}
            <input
              ref={fileInputRef}
              type="file"
              name="proofImage"
              accept="image/*"
              onChange={handleFileChange}
              className={imagePreview ? "hidden" : "block w-full text-xs text-slate-500"}
            />
            {imagePreview && (
              <div className="relative mt-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="" className="w-full max-h-48 object-cover rounded-xl border border-slate-200" />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute top-2 end-2 bg-slate-900/70 text-white text-[10px] font-bold px-2 py-1 rounded-lg"
                >
                  {t.changeImage}
                </button>
              </div>
            )}
            {imageError && <p className="text-[11px] text-red-600 mt-1">{imageError}</p>}
          </div>

          {state.error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-2">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending || !amount || Number(amount) <= 0 || !imagePreview}
            className="w-full bg-orange-600 text-white rounded-xl py-2.5 font-bold text-sm disabled:opacity-60 transition-transform duration-150 active:scale-[0.98]"
          >
            {pending ? "..." : t.submitDonation}
          </button>
        </form>
      )}

      {activeMethods.length === 0 && (
        <p className="text-center text-slate-400 text-sm py-8">
          {lang === "ar" ? "ما في طرق دفع مفعّلة حاليًا." : "No payment methods are active right now."}
        </p>
      )}
    </div>
  );
}
