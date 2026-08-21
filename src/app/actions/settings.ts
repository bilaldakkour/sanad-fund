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
  const accountNumber = String(formData.get("accountNumber") || "").trim();
  const feePercent = Number(formData.get("feePercent") || 0);
  const icon = formData.get("icon");

  if (!code || !nameAr || !nameEn) {
    return { error: "لازم تحط الرمز والاسم بالعربي والإنجليزي." };
  }
  if (Number.isNaN(feePercent) || feePercent < 0 || feePercent >= 100) {
    return { error: "نسبة الخصم لازم تكون بين 0 و99." };
  }

  const supabase = await createClient();

  let iconPath: string | null = null;
  if (icon instanceof File && icon.size > 0) {
    if (icon.size > 2 * 1024 * 1024) {
      return { error: "صورة الشعار كبيرة كتير — الحد الأقصى 2 ميغابايت." };
    }
    const ext = icon.name.split(".").pop() || "png";
    const path = `${code}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("payment-method-icons")
      .upload(path, icon, { contentType: icon.type });
    if (uploadError) return { error: uploadError.message };
    iconPath = path;
  }

  const { error } = await supabase.from("payment_methods").insert({
    code,
    name_ar: nameAr,
    name_en: nameEn,
    instructions_ar: instructionsAr || null,
    instructions_en: instructionsEn || null,
    account_number: accountNumber || null,
    fee_percent: feePercent,
    icon_path: iconPath,
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
