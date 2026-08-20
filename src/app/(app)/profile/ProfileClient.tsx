"use client";

import { useState, useTransition } from "react";
import { Check, Trash2, XCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAppData } from "@/lib/AppDataProvider";
import { fmt } from "@/lib/format";
import { LedgerRow } from "@/components/LedgerRow";
import { RoleBadge } from "@/components/RoleBadge";
import { ReceiptModal } from "@/components/modals/ReceiptModal";
import { EditDonationModal } from "@/components/modals/EditDonationModal";
import { approveMember, rejectMember, removeMember, setMemberRole } from "@/app/actions/members";
import { parsePhone } from "@/lib/countries";
import type { LedgerEntry, Role } from "@/lib/types";

const ASSIGNABLE_ROLES: Role[] = ["member", "collector", "supervisor", "treasurer", "admin"];

export function ProfileClient({
  entries,
  myByCurrency,
  pendingMembers,
}: {
  entries: LedgerEntry[];
  myByCurrency: Record<string, number>;
  pendingMembers: { id: string; full_name: string; phone: string; email: string }[];
}) {
  const { t, lang } = useLanguage();
  const { currencies, profile, approvedMembers } = useAppData();
  const [receiptEntry, setReceiptEntry] = useState<LedgerEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);
  const [isPending, startTransition] = useTransition();

  const isAdmin = profile.role === "admin";
  const canEdit = ["admin", "treasurer", "collector"].includes(profile.role);

  return (
    <>
    <div className="space-y-4 print:hidden">
      <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-black">
          {profile.full_name[0]}
        </div>
        <div className="flex-1">
          <p className="font-bold text-slate-800 text-sm">{profile.full_name}</p>
          <RoleBadge role={profile.role} />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-xs font-bold text-slate-500 mb-2">
          {t.myDonations} ({entries.length})
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.keys(myByCurrency).length === 0 ? (
            <p className="text-slate-400 text-xs">{t.noDonationsYet}</p>
          ) : (
            Object.entries(myByCurrency).map(([code, amt]) => (
              <span key={code} className="num-mono text-sm font-bold bg-orange-50 text-orange-700 px-3 py-1 rounded-lg">
                {fmt(amt, code, currencies)}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="space-y-2">
        {entries.map((e) => (
          <LedgerRow
            key={e.id}
            entry={e}
            currencies={currencies}
            canEdit={canEdit}
            onPrint={setReceiptEntry}
            onEdit={setEditingEntry}
          />
        ))}
      </div>

      {isAdmin && (
        <div>
          <p className="font-bold text-slate-700 text-sm mb-2">
            {t.pendingRequests} ({pendingMembers.length})
          </p>
          <div className="space-y-2">
            {pendingMembers.length === 0 && <p className="text-slate-400 text-xs">{t.noNewRequests}</p>}
            {pendingMembers.map((m) => {
              const { country, number } = parsePhone(m.phone);
              return (
                <div key={m.id} className="bg-white rounded-2xl p-3 shadow-sm space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center font-black shrink-0">
                      {m.full_name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-slate-800 truncate">{m.full_name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{m.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 rounded-xl px-2.5 py-1.5">
                    <span className="text-base shrink-0">{country?.flag ?? "🌐"}</span>
                    <span className="num-mono font-bold">{country?.dial ?? ""}</span>
                    <span className="num-mono">{number}</span>
                    {country && (
                      <span className="text-slate-400 truncate">
                        · {lang === "ar" ? country.nameAr : country.nameEn}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={isPending}
                      onClick={() => startTransition(() => approveMember(m.id))}
                      className="flex-1 flex items-center justify-center gap-1 bg-orange-100 text-orange-700 rounded-xl py-1.5 text-xs font-bold disabled:opacity-50"
                    >
                      <Check size={14} /> {t.approveBtn}
                    </button>
                    <button
                      disabled={isPending}
                      onClick={() => startTransition(() => rejectMember(m.id))}
                      className="flex-1 flex items-center justify-center gap-1 bg-slate-100 text-slate-500 rounded-xl py-1.5 text-xs font-bold disabled:opacity-50"
                    >
                      <XCircle size={14} /> {t.rejectBtn}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="font-bold text-slate-700 text-sm mb-2 mt-4">{t.approvedMembersHeading}</p>
          <div className="space-y-2">
            {approvedMembers.map((m) => {
              const { country, number } = parsePhone(m.phone);
              return (
              <div key={m.id} className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">{m.full_name}</p>
                  <p className="text-[11px] text-slate-400 num-mono truncate">
                    {country?.flag ?? "🌐"} {number}
                  </p>
                </div>
                {m.id === profile.id ? (
                  <RoleBadge role={m.role} />
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <select
                      defaultValue={m.role}
                      disabled={isPending}
                      onChange={(e) => startTransition(() => setMemberRole(m.id, e.target.value as Role))}
                      className="text-xs font-bold border border-slate-200 rounded-lg px-2 py-1 outline-none"
                    >
                      {ASSIGNABLE_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {t.roles[r]}
                        </option>
                      ))}
                    </select>
                    <button
                      disabled={isPending}
                      onClick={() => {
                        if (window.confirm(t.removeMemberConfirm)) {
                          startTransition(() => removeMember(m.id));
                        }
                      }}
                      className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center disabled:opacity-50"
                      title={t.removeMember}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </div>
      )}
    </div>

      {receiptEntry && <ReceiptModal entry={receiptEntry} onClose={() => setReceiptEntry(null)} />}
      {editingEntry && <EditDonationModal entry={editingEntry} onClose={() => setEditingEntry(null)} />}
    </>
  );
}
