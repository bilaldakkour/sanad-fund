"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Logo } from "@/components/Logo";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { signUp, type AuthActionState } from "@/app/actions/auth";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { CountryPickerModal } from "@/components/CountryPickerModal";

const initialState: AuthActionState = { error: null };

export default function RegisterPage() {
  const { t, lang } = useLanguage();
  const [state, formAction, pending] = useActionState(signUp, initialState);
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-6 py-10">
      <div className="flex flex-col items-center mb-8">
        <Logo size={56} />
        <p className="text-white font-black text-xl mt-3">{t.appName}</p>
        <p className="text-orange-300 text-sm">{t.tagline}</p>
      </div>

      <form action={formAction} className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-3 shadow-xl">
        <p className="font-bold text-slate-800 text-lg">{t.registerTitle}</p>
        <p className="text-slate-400 text-sm -mt-2">{t.registerSubtitle}</p>

        <input
          name="fullName"
          required
          placeholder={t.fullName}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors duration-150 focus:border-orange-500"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowCountryPicker(true)}
            className="w-24 shrink-0 flex items-center justify-center gap-1 border border-slate-200 rounded-xl px-1.5 py-2.5 text-sm num-mono"
          >
            <span className="text-lg">{country.flag}</span>
            {country.dial}
          </button>
          <input
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            type="tel"
            inputMode="numeric"
            required
            placeholder={t.phone}
            className="flex-1 min-w-0 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors duration-150 focus:border-orange-500"
          />
        </div>
        <input type="hidden" name="phone" value={`${country.dial} ${phoneNumber}`.trim()} />
        {phoneNumber && (
          <p className="text-[11px] text-slate-400 -mt-1.5">
            {lang === "ar" ? "رح ينحفظ كـ" : "Will be saved as"}:{" "}
            <span className="num-mono">
              {country.dial} {phoneNumber}
            </span>
          </p>
        )}
        {showCountryPicker && (
          <CountryPickerModal
            onSelect={(c) => {
              setCountry(c);
              setShowCountryPicker(false);
            }}
            onClose={() => setShowCountryPicker(false)}
          />
        )}
        <input
          name="email"
          type="email"
          required
          placeholder={t.email}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors duration-150 focus:border-orange-500"
        />
        <input
          name="password"
          type="password"
          required
          minLength={6}
          placeholder={t.password}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors duration-150 focus:border-orange-500"
        />

        {state.error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-2">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-orange-600 text-white rounded-xl py-2.5 font-bold text-sm disabled:opacity-60 transition-transform duration-150 active:scale-[0.98]"
        >
          {pending ? "..." : t.registerBtn}
        </button>

        <p className="text-center text-xs text-slate-400 pt-1">
          {t.haveAccount}{" "}
          <Link href="/login" className="text-orange-600 font-bold">
            {t.loginLink}
          </Link>
        </p>
      </form>
    </div>
  );
}
