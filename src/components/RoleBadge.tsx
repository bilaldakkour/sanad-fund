import type { Role } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const ROLE_COLOR: Record<Role, string> = {
  admin: "bg-orange-600 text-white border-orange-600",
  treasurer: "bg-slate-700 text-white border-slate-700",
  supervisor: "bg-orange-100 text-orange-800 border-orange-300",
  collector: "bg-slate-200 text-slate-700 border-slate-300",
  member: "bg-slate-100 text-slate-500 border-slate-200",
  pending: "bg-amber-100 text-amber-700 border-amber-300",
};

export function RoleBadge({ role }: { role: Role }) {
  const { t } = useLanguage();
  return (
    <span
      className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full border ${ROLE_COLOR[role] || ROLE_COLOR.member}`}
    >
      {t.roles[role] || t.roles.member}
    </span>
  );
}
