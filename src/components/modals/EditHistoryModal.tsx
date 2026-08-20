"use client";

import { useEffect, useState } from "react";
import { History, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAppData } from "@/lib/AppDataProvider";
import { createClient } from "@/lib/supabase/client";
import { fmt } from "@/lib/format";
import type { DonationEdit } from "@/lib/types";

function DiffRow({ label, from, to }: { label: string; from: string; to: string }) {
  if (from === to) return null;
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-slate-400 shrink-0">{label}</span>
      <span className="flex items-center gap-1.5 num-mono">
        <span className="text-slate-400 line-through">{from}</span>
        <span className="text-slate-300">←</span>
        <span className="font-bold text-slate-800">{to}</span>
      </span>
    </div>
  );
}

export function EditHistoryModal({ donationId, onClose }: { donationId: string; onClose: () => void }) {
  const { t } = useLanguage();
  const { currencies } = useAppData();
  const [edits, setEdits] = useState<DonationEdit[] | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    supabase
      .from("donation_edits_feed")
      .select("*")
      .eq("donation_id", donationId)
      .then(({ data }) => {
        if (active) setEdits((data as DonationEdit[]) ?? []);
      });
    return () => {
      active = false;
    };
  }, [donationId]);

  return (
    <div
      className="print:hidden fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-b-3xl sm:rounded-3xl sm:mt-20 p-5 space-y-3 shadow-lg max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <p className="font-bold text-slate-800 flex items-center gap-1">
            <History size={16} /> {t.editHistoryTitle}
          </p>
          <button onClick={onClose}>
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {edits === null ? (
          <div className="space-y-2">
            <div className="h-16 bg-slate-50 rounded-2xl animate-pulse" />
            <div className="h-16 bg-slate-50 rounded-2xl animate-pulse" />
          </div>
        ) : edits.length === 0 ? (
          <p className="text-slate-400 text-sm py-6 text-center">{t.editHistoryEmpty}</p>
        ) : (
          <div className="space-y-2">
            {edits.map((edit) => (
              <div key={edit.id} className="bg-slate-50 rounded-2xl p-3 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    {t.editedByOn} <span className="font-bold text-slate-600">{edit.edited_by_name}</span>
                  </span>
                  <span>{new Date(edit.edited_at).toISOString().slice(0, 16).replace("T", " ")}</span>
                </div>
                <DiffRow
                  label={t.fieldMember}
                  from={edit.old_member_name ?? "—"}
                  to={edit.new_member_name ?? "—"}
                />
                <DiffRow
                  label={t.fieldAmount}
                  from={fmt(edit.old_amount, edit.old_currency, currencies)}
                  to={fmt(edit.new_amount, edit.new_currency, currencies)}
                />
                <DiffRow label={t.fieldCurrency} from={edit.old_currency} to={edit.new_currency} />
                <DiffRow label={t.fieldNote} from={edit.old_note ?? "—"} to={edit.new_note ?? "—"} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
