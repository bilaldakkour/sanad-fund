export type PeriodType = "day" | "week" | "month" | "custom";

// كل التواريخ هون UTC-midnight كرمال ما يصير فرق بسبب منطقة زمنية المتصفح مقابل السيرفر.

export function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function toMonthInput(d: Date): string {
  return d.toISOString().slice(0, 7);
}

export function parseDateInput(s: string): Date {
  const [y, m, day] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

export function parseMonthInput(s: string): Date {
  const [y, m] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1));
}

export function addDays(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n));
}

export function startOfWeekMonday(d: Date): Date {
  const dow = d.getUTCDay(); // 0=Sun..6=Sat
  const diff = (dow + 6) % 7; // days since Monday
  return addDays(d, -diff);
}

export function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export function endOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
}

export function addMonths(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}

/** يحسب [start, end] (الاتنين شاملين) حسب نوع الفترة ونقطة مرجعية. */
export function computeRange(period: PeriodType, anchor: Date, customEnd?: Date): { start: Date; end: Date } {
  switch (period) {
    case "day":
      return { start: anchor, end: anchor };
    case "week": {
      const start = startOfWeekMonday(anchor);
      return { start, end: addDays(start, 6) };
    }
    case "month":
      return { start: startOfMonth(anchor), end: endOfMonth(anchor) };
    case "custom":
      return { start: anchor, end: customEnd ?? anchor };
  }
}

/** الفترة المجاورة (سابقة/تالية) لأزرار التنقل — للـ day/week/month بس. */
export function shiftRange(period: PeriodType, anchor: Date, delta: number): Date {
  switch (period) {
    case "day":
      return addDays(anchor, delta);
    case "week":
      return addDays(anchor, delta * 7);
    case "month":
      return addMonths(anchor, delta);
    case "custom":
      return anchor;
  }
}
