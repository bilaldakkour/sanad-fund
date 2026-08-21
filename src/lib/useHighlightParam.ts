"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

// بيقرأ ?highlight=<id> من الرابط (متل يلي بتبعتو الإشعارات)، بيلفّ لعنصر
// id="entry-<id>" وبيرجّع نفس الـ id مدة قصيرة كرمال العنصر يقدر يعرض حالة
// "مميّزة" (رينغ/خلفية) لحظة الوصول، وبعدين تختفي لحالها.
export function useHighlightParam(): string | null {
  const searchParams = useSearchParams();
  const highlight = searchParams.get("highlight");
  const [active, setActive] = useState(highlight);

  useEffect(() => {
    if (!highlight) return;
    const el = document.getElementById(`entry-${highlight}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = setTimeout(() => setActive(null), 2500);
    return () => clearTimeout(timer);
  }, [highlight]);

  return active;
}
