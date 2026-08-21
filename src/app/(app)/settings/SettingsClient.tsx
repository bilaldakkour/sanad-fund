"use client";

import { useActionState, useTransition } from "react";
import { CreditCard, Download, EyeOff } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAppData } from "@/lib/AppDataProvider";
import { saveFundSettings, addCurrency, addPaymentMethod, togglePaymentMethod } from "@/app/actions/settings";
import type { FormActionState } from "@/app/actions/donations";

const initialState: FormActionState = { error: null };

export function SettingsClient() {
  const { t, lang } = useLanguage();
  const { settings, currencies, paymentMethods, profile } = useAppData();
  const isAdmin = profile.role === "admin";
  const [saveState, saveAction, savePending] = useActionState(saveFundSettings, initialState);
  const [currencyState, currencyAction, currencyPending] = useActionState(addCurrency, initialState);
  const [methodState, methodAction, methodPending] = useActionState(addPaymentMethod, initialState);
  const [isToggling, startToggle] = useTransition();

  return (
    <div className="space-y-5 print:hidden">
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
        <p className="font-bold text-slate-700 text-sm flex items-center gap-1">
          <Download size={14} /> {t.exportTitle}
        </p>
        <p className="text-[11px] text-slate-400">{t.exportDesc}</p>
        <a
          href="/api/export"
          className="w-full bg-slate-900 text-white rounded-xl py-2.5 font-bold text-sm flex items-center justify-center gap-2 transition-transform duration-150 active:scale-[0.98]"
        >
          <Download size={16} /> {t.exportButton}
        </a>
      </div>

      {!isAdmin && (
        <p className="text-[11px] text-slate-400 bg-slate-50 border border-slate-200 rounded-xl p-2">
          {t.settingsRestrictedNote}
        </p>
      )}

      {isAdmin && (
      <>
      <form action={saveAction} className="space-y-5">
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <label className="block text-xs font-bold text-slate-500">{t.orgNameLabel} (AR)</label>
          <input
            name="orgNameAr"
            defaultValue={settings.org_name_ar}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-orange-500"
          />
          <label className="block text-xs font-bold text-slate-500">{t.orgNameLabel} (EN)</label>
          <input
            name="orgNameEn"
            defaultValue={settings.org_name_en}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-orange-500"
          />
          <label className="block text-xs font-bold text-slate-500">{t.taglineLabel} (AR)</label>
          <input
            name="taglineAr"
            defaultValue={settings.tagline_ar}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-orange-500"
          />
          <label className="block text-xs font-bold text-slate-500">{t.taglineLabel} (EN)</label>
          <input
            name="taglineEn"
            defaultValue={settings.tagline_en}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-orange-500"
          />
          <label className="block text-xs font-bold text-slate-500">{t.thankYouLabel} (AR)</label>
          <textarea
            name="thankYouAr"
            defaultValue={settings.thank_you_ar}
            rows={2}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-orange-500"
          />
          <label className="block text-xs font-bold text-slate-500">{t.thankYouLabel} (EN)</label>
          <textarea
            name="thankYouEn"
            defaultValue={settings.thank_you_en}
            rows={2}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-orange-500"
          />
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
          <p className="font-bold text-slate-700 text-sm flex items-center gap-1">
            <EyeOff size={14} /> {t.privacyTitle}
          </p>
          <label className="flex items-center justify-between gap-2 pt-1">
            <span className="text-xs text-slate-500 flex-1">{t.hideAmountsLabel}</span>
            <input
              type="checkbox"
              name="hideAmounts"
              defaultChecked={settings.hide_amounts}
              className="w-5 h-5 accent-orange-600"
            />
          </label>
          <p className="text-[11px] text-slate-400">{t.hideAmountsDesc}</p>
          <p className="text-[11px] text-orange-700 bg-orange-50 border border-orange-200 rounded-xl p-2 mt-1">
            {t.supervisorRuleNote}
          </p>
        </div>

        {saveState.error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-2">{saveState.error}</p>
        )}

        <button
          type="submit"
          disabled={savePending}
          className="w-full bg-orange-600 text-white rounded-xl py-2.5 font-bold text-sm disabled:opacity-60 transition-transform duration-150 active:scale-[0.98]"
        >
          {savePending ? "..." : t.saveSettings}
        </button>
      </form>

      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <p className="font-bold text-slate-700 text-sm">{t.currenciesTitle}</p>
        <div className="flex flex-wrap gap-2">
          {currencies.map((c) => (
            <span key={c.code} className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded-lg">
              {c.symbol} {c.code}
            </span>
          ))}
        </div>
        <form action={currencyAction} className="space-y-2">
          <p className="text-xs font-bold text-slate-500 pt-2">{t.addCurrency}</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              name="code"
              placeholder={t.currencyCode}
              className="border border-slate-200 rounded-xl px-2 py-2 text-xs outline-none transition-colors duration-150 focus:border-orange-500"
            />
            <input
              name="symbol"
              placeholder={t.currencySymbol}
              className="border border-slate-200 rounded-xl px-2 py-2 text-xs outline-none transition-colors duration-150 focus:border-orange-500"
            />
          </div>
          {currencyState.error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-2">
              {currencyState.error}
            </p>
          )}
          <button
            type="submit"
            disabled={currencyPending}
            className="w-full bg-slate-800 text-white rounded-xl py-2 text-xs font-bold disabled:opacity-60"
          >
            {t.add}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <p className="font-bold text-slate-700 text-sm flex items-center gap-1">
          <CreditCard size={14} /> {t.paymentMethodsTitle}
        </p>
        <div className="space-y-2">
          {paymentMethods.map((m) => (
            <div
              key={m.code}
              className="flex items-center justify-between gap-2 bg-slate-50 rounded-xl px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-700 truncate">
                  {lang === "ar" ? m.name_ar : m.name_en}
                </p>
                {!m.is_active && <p className="text-[10px] text-slate-400">{t.inactiveMethod}</p>}
              </div>
              {m.code !== "collector" && (
                <button
                  type="button"
                  disabled={isToggling}
                  onClick={() => startToggle(() => togglePaymentMethod(m.code, !m.is_active))}
                  className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors duration-150 disabled:opacity-50 ${
                    m.is_active
                      ? "bg-white text-slate-500 border-slate-200"
                      : "bg-orange-50 text-orange-700 border-orange-200"
                  }`}
                >
                  {m.is_active ? t.deactivateMethod : t.activateMethod}
                </button>
              )}
            </div>
          ))}
        </div>

        <form action={methodAction} className="space-y-2">
          <p className="text-xs font-bold text-slate-500 pt-2">{t.addPaymentMethod}</p>
          <input
            name="code"
            placeholder={t.paymentMethodCodePlaceholder}
            className="w-full border border-slate-200 rounded-xl px-2 py-2 text-xs outline-none transition-colors duration-150 focus:border-orange-500"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              name="nameAr"
              placeholder={t.paymentMethodNameArPlaceholder}
              className="border border-slate-200 rounded-xl px-2 py-2 text-xs outline-none transition-colors duration-150 focus:border-orange-500"
            />
            <input
              name="nameEn"
              placeholder={t.paymentMethodNameEnPlaceholder}
              className="border border-slate-200 rounded-xl px-2 py-2 text-xs outline-none transition-colors duration-150 focus:border-orange-500"
            />
          </div>
          <textarea
            name="instructionsAr"
            rows={2}
            placeholder={t.paymentMethodInstructionsArPlaceholder}
            className="w-full border border-slate-200 rounded-xl px-2 py-2 text-xs outline-none transition-colors duration-150 focus:border-orange-500"
          />
          <textarea
            name="instructionsEn"
            rows={2}
            placeholder={t.paymentMethodInstructionsEnPlaceholder}
            className="w-full border border-slate-200 rounded-xl px-2 py-2 text-xs outline-none transition-colors duration-150 focus:border-orange-500"
          />
          {methodState.error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-2">
              {methodState.error}
            </p>
          )}
          <button
            type="submit"
            disabled={methodPending}
            className="w-full bg-slate-800 text-white rounded-xl py-2 text-xs font-bold disabled:opacity-60"
          >
            {t.add}
          </button>
        </form>
      </div>
      </>
      )}
    </div>
  );
}
