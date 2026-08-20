export interface CountryDialCode {
  code: string;
  dial: string;
  flag: string;
  nameAr: string;
  nameEn: string;
}

// لبنان أول واحدة (افتراضي)، وبعدها دول الخليج وبلاد الاغتراب الشائعة، وبعدها الباقي أبجديًا.
export const COUNTRY_DIAL_CODES: CountryDialCode[] = [
  { code: "LB", dial: "+961", flag: "🇱🇧", nameAr: "لبنان", nameEn: "Lebanon" },
  { code: "SY", dial: "+963", flag: "🇸🇾", nameAr: "سوريا", nameEn: "Syria" },
  { code: "JO", dial: "+962", flag: "🇯🇴", nameAr: "الأردن", nameEn: "Jordan" },
  { code: "PS", dial: "+970", flag: "🇵🇸", nameAr: "فلسطين", nameEn: "Palestine" },
  { code: "IQ", dial: "+964", flag: "🇮🇶", nameAr: "العراق", nameEn: "Iraq" },
  { code: "EG", dial: "+20", flag: "🇪🇬", nameAr: "مصر", nameEn: "Egypt" },
  { code: "SA", dial: "+966", flag: "🇸🇦", nameAr: "السعودية", nameEn: "Saudi Arabia" },
  { code: "AE", dial: "+971", flag: "🇦🇪", nameAr: "الإمارات", nameEn: "UAE" },
  { code: "QA", dial: "+974", flag: "🇶🇦", nameAr: "قطر", nameEn: "Qatar" },
  { code: "KW", dial: "+965", flag: "🇰🇼", nameAr: "الكويت", nameEn: "Kuwait" },
  { code: "BH", dial: "+973", flag: "🇧🇭", nameAr: "البحرين", nameEn: "Bahrain" },
  { code: "OM", dial: "+968", flag: "🇴🇲", nameAr: "عُمان", nameEn: "Oman" },
  { code: "US", dial: "+1", flag: "🇺🇸", nameAr: "أمريكا", nameEn: "United States" },
  { code: "CA", dial: "+1", flag: "🇨🇦", nameAr: "كندا", nameEn: "Canada" },
  { code: "FR", dial: "+33", flag: "🇫🇷", nameAr: "فرنسا", nameEn: "France" },
  { code: "DE", dial: "+49", flag: "🇩🇪", nameAr: "ألمانيا", nameEn: "Germany" },
  { code: "GB", dial: "+44", flag: "🇬🇧", nameAr: "بريطانيا", nameEn: "United Kingdom" },
  { code: "AU", dial: "+61", flag: "🇦🇺", nameAr: "أستراليا", nameEn: "Australia" },
  { code: "BR", dial: "+55", flag: "🇧🇷", nameAr: "البرازيل", nameEn: "Brazil" },
  { code: "SE", dial: "+46", flag: "🇸🇪", nameAr: "السويد", nameEn: "Sweden" },
  { code: "TR", dial: "+90", flag: "🇹🇷", nameAr: "تركيا", nameEn: "Turkey" },
  { code: "CY", dial: "+357", flag: "🇨🇾", nameAr: "قبرص", nameEn: "Cyprus" },
  { code: "GR", dial: "+30", flag: "🇬🇷", nameAr: "اليونان", nameEn: "Greece" },
  { code: "IT", dial: "+39", flag: "🇮🇹", nameAr: "إيطاليا", nameEn: "Italy" },
  { code: "ES", dial: "+34", flag: "🇪🇸", nameAr: "إسبانيا", nameEn: "Spain" },
  { code: "NL", dial: "+31", flag: "🇳🇱", nameAr: "هولندا", nameEn: "Netherlands" },
  { code: "CH", dial: "+41", flag: "🇨🇭", nameAr: "سويسرا", nameEn: "Switzerland" },
  { code: "MX", dial: "+52", flag: "🇲🇽", nameAr: "المكسيك", nameEn: "Mexico" },
  { code: "AR", dial: "+54", flag: "🇦🇷", nameAr: "الأرجنتين", nameEn: "Argentina" },
];

export const DEFAULT_COUNTRY = COUNTRY_DIAL_CODES[0];

/** "+961 71234567" -> { country: لبنان, number: "71234567" } — الرقم مخزّن دايمًا
 * بصيغة "رمز_الدولة مسافة رقم" (انظر صفحة التسجيل)، فالفصل بالمسافة الأولى كافي. */
export function parsePhone(phone: string): { country: CountryDialCode | undefined; number: string } {
  const spaceIdx = phone.indexOf(" ");
  if (spaceIdx === -1) return { country: undefined, number: phone };
  const dial = phone.slice(0, spaceIdx);
  const number = phone.slice(spaceIdx + 1);
  const country = COUNTRY_DIAL_CODES.find((c) => c.dial === dial);
  return { country, number };
}
