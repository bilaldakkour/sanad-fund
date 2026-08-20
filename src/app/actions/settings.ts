"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormActionState } from "@/app/actions/donations";

const ok: FormActionState = { error: null };

export async function saveFundSettings(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("fund_settings")
    .update({
      org_name_ar: String(formData.get("orgNameAr") || "").trim(),
      org_name_en: String(formData.get("orgNameEn") || "").trim(),
      tagline_ar: String(formData.get("taglineAr") || "").trim(),
      tagline_en: String(formData.get("taglineEn") || "").trim(),
      thank_you_ar: String(formData.get("thankYouAr") || "").trim(),
      thank_you_en: String(formData.get("thankYouEn") || "").trim(),
      hide_amounts: formData.get("hideAmounts") === "on",
    })
    .eq("id", 1);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return ok;
}

export async function addCurrency(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const code = String(formData.get("code") || "").trim().toUpperCase();
  const symbol = String(formData.get("symbol") || "").trim() || code;

  if (!code) return { error: "لازم تحط رمز العملة." };

  const supabase = await createClient();
  const { error } = await supabase.from("currencies").insert({ code, symbol });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return ok;
}

export async function addPaymentMethod(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const code = String(formData.get("code") || "").trim().toLowerCase().replace(/\s+/g, "_");
  const nameAr = String(formData.get("nameAr") || "").trim();
  const nameEn = String(formData.get("nameEn") || "").trim();
  const instructionsAr = String(formData.get("instructionsAr") || "").trim();
  const instructionsEn = String(formData.get("instructionsEn") || "").trim();

  if (!code || !nameAr || !nameEn) {
    return { error: "لازم تحط الرمز والاسم بالعربي والإنجليزي." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("payment_methods").insert({
    code,
    name_ar: nameAr,
    name_en: nameEn,
    instructions_ar: instructionsAr || null,
    instructions_en: instructionsEn || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return ok;
}

export async function togglePaymentMethod(code: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("payment_methods").update({ is_active: isActive }).eq("code", code);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
