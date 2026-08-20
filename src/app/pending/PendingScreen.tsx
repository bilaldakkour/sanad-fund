"use client";

import { Ban, Clock, XCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { signOut } from "@/app/actions/auth";

const CONFIG = {
  pending: { icon: Clock, tone: "bg-amber-50 text-amber-600" },
  rejected: { icon: XCircle, tone: "bg-red-50 text-red-600" },
  removed: { icon: Ban, tone: "bg-red-50 text-red-600" },
} as const;

export function PendingScreen({ status }: { status: "pending" | "rejected" | "removed" }) {
  const { t } = useLanguage();
  const { icon: Icon, tone } = CONFIG[status];

  const title = status === "pending" ? t.pendingTitle : status === "rejected" ? t.rejectedTitle : t.removedTitle;
  const desc = status === "pending" ? t.pendingDesc : status === "rejected" ? t.rejectedDesc : t.removedDesc;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-6 text-center">
      <Logo size={56} />
      <p className="text-white font-black text-xl mt-3">{t.appName}</p>

      <div className="mt-8 bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl">
        <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${tone}`}>
          <Icon size={28} />
        </div>
        <p className="font-bold text-slate-800 mt-4">{title}</p>
        <p className="text-slate-400 text-sm mt-1">{desc}</p>

        <form action={signOut} className="mt-5">
          <button type="submit" className="w-full bg-slate-100 text-slate-600 rounded-xl py-2.5 font-bold text-sm">
            {t.backToLogin}
          </button>
        </form>
      </div>
    </div>
  );
}
