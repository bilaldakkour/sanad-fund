"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAppData } from "@/lib/AppDataProvider";
import { LedgerRow } from "@/components/LedgerRow";
import { ReceiptModal } from "@/components/modals/ReceiptModal";
import { EditDonationModal } from "@/components/modals/EditDonationModal";
import { AddEntryModal } from "@/components/modals/AddEntryModal";
import type { LedgerEntry } from "@/lib/types";

type Filter = "all" | "donation" | "expense";

export function LedgerClient({ entries }: { entries: LedgerEntry[] }) {
  const { t } = useLanguage();
  const { currencies, profile } = useAppData();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [receiptEntry, setReceiptEntry] = useState<LedgerEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const canAddDonation = ["admin", "treasurer", "collector"].includes(profile.role);
  const canAddExpense = profile.role === "admin";

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return entries
      .filter((e) => (filter === "all" ? true : e.type === filter))
      .filter((e) => (e.personName + e.note).toLowerCase().includes(q));
  }, [entries, filter, search]);

  return (
    <>
    <div className="space-y-3 print:hidden">
      <div className="bg-orange-50 border border-orange-200 text-orange-800 text-xs rounded-xl p-3">
        {t.transparencyNote}
      </div>

      <div className="relative">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.search}
          className="w-full bg-white border border-slate-200 rounded-xl py-2 pr-9 pl-3 text-sm outline-none focus:border-orange-500"
        />
      </div>

      <div className="flex gap-2">
        {([
          ["all", t.all],
          ["donation", t.donations],
          ["expense", t.expenses],
        ] as [Filter, string][]).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border ${filter === k ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"}`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-8">{t.noResults}</p>
        ) : (
          filtered.map((e) => (
            <LedgerRow
              key={`${e.type}-${e.id}`}
              entry={e}
              currencies={currencies}
              canEdit={canAddDonation}
              onPrint={setReceiptEntry}
              onEdit={setEditingEntry}
            />
          ))
        )}
      </div>

      {(canAddDonation || canAddExpense) && (
        <button
          onClick={() => setShowAdd(true)}
          className="print:hidden fixed bottom-20 left-1/2 -translate-x-1/2 bg-orange-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg z-30"
        >
          <Plus size={22} />
        </button>
      )}

    </div>

      {showAdd && <AddEntryModal canAddExpense={canAddExpense} onClose={() => setShowAdd(false)} />}
      {receiptEntry && <ReceiptModal entry={receiptEntry} onClose={() => setReceiptEntry(null)} />}
      {editingEntry && <EditDonationModal entry={editingEntry} onClose={() => setEditingEntry(null)} />}
    </>
  );
}
