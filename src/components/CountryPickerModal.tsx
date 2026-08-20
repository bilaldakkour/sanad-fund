"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { COUNTRY_DIAL_CODES, type CountryDialCode } from "@/lib/countries";

export function CountryPickerModal({
  onSelect,
  onClose,
}: {
  onSelect: (country: CountryDialCode) => void;
  onClose: () => void;
}) {
  const { lang } = useLanguage();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRY_DIAL_CODES;
    return COUNTRY_DIAL_CODES.filter(
      (c) =>
        c.nameAr.includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="print:hidden fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-t-3xl p-5 space-y-3 max-h-[80vh] flex flex-col"
      >
        <div className="flex items-center justify-between shrink-0">
          <p className="font-bold text-slate-800">{lang === "ar" ? "اختر الدولة" : "Select country"}</p>
          <button type="button" onClick={onClose}>
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="relative shrink-0">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === "ar" ? "بحث بالاسم أو الرمز..." : "Search by name or code..."}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pr-9 pl-3 text-sm outline-none transition-colors duration-150 focus:border-orange-500"
          />
        </div>

        <div className="overflow-y-auto -mx-1 px-1 space-y-1">
          {filtered.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">
              {lang === "ar" ? "ما في نتائج مطابقة" : "No matching results"}
            </p>
          ) : (
            filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => onSelect(c)}
                className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-slate-50 text-start"
              >
                <span className="text-xl shrink-0">{c.flag}</span>
                <span className="flex-1 text-sm text-slate-700 truncate">
                  {lang === "ar" ? c.nameAr : c.nameEn}
                </span>
                <span className="num-mono text-sm font-bold text-slate-400 shrink-0">{c.dial}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
