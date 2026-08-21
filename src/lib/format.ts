import type { Currency } from "@/lib/types";

export function fmt(amount: number, currencyCode: string, currencies: Currency[]): string {
  const c = currencies.find((x) => x.code === currencyCode);
  const symbol = c?.symbol ?? "";
  const rounded = Math.round(amount * 100) / 100;
  const hasDecimals = Math.abs(rounded % 1) > 0.001;
  const formatted = rounded.toLocaleString("en-US", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}

export function receiptNo(n: number): string {
  return String(n).padStart(6, "0");
}

export function paymentMethodIconUrl(path: string | null): string | null {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/payment-method-icons/${path}`;
}

// أسماء الأشهر الشامية (مطابقة للبروتوتايب) — مختلفة عن الأسماء العربية الفصحى المعيارية.
const LEVANTINE_MONTHS_AR = [
  "كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران",
  "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول",
];
const MONTHS_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function monthLabel(monthIndex: number, lang: "ar" | "en"): string {
  return lang === "ar" ? LEVANTINE_MONTHS_AR[monthIndex] : MONTHS_EN[monthIndex];
}

/** "2026-08-21" -> "21 آب 2026" / "Aug 21, 2026" */
export function formatDateLabel(isoDate: string, lang: "ar" | "en"): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const month = monthLabel(m - 1, lang);
  return lang === "ar" ? `${d} ${month} ${y}` : `${month} ${d}, ${y}`;
}
