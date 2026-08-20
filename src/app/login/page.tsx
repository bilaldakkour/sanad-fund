"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Logo } from "@/components/Logo";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { signIn, type AuthActionState } from "@/app/actions/auth";

const initialState: AuthActionState = { error: null };

export default function LoginPage() {
  const { t } = useLanguage();
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center mb-8">
        <Logo size={56} />
        <p className="text-white font-black text-xl mt-3">{t.appName}</p>
        <p className="text-orange-300 text-sm">{t.tagline}</p>
      </div>

      <form action={formAction} className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-3 shadow-xl">
        <p className="font-bold text-slate-800 text-lg">{t.loginTitle}</p>
        <p className="text-slate-400 text-sm -mt-2">{t.loginSubtitle}</p>

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
          placeholder={t.password}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors duration-150 focus:border-orange-500"
        />

        {state.error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-2">
            {t.authError}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-orange-600 text-white rounded-xl py-2.5 font-bold text-sm disabled:opacity-60 transition-transform duration-150 active:scale-[0.98]"
        >
          {pending ? "..." : t.loginBtn}
        </button>

        <p className="text-center text-xs text-slate-400 pt-1">
          {t.noAccount}{" "}
          <Link href="/register" className="text-orange-600 font-bold">
            {t.joinRequest}
          </Link>
        </p>
      </form>
    </div>
  );
}
