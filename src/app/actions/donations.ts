"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface FormActionState {
  error: string | null;
}

const ok: FormActionState = { error: null };

export async function addDonation(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const memberId = String(formData.get("memberId") || "");
  const amount = Number(formData.get("amount"));
  const currency = String(formData.get("currency") || "");
  const note = String(formData.get("note") || "").trim();

  if (!memberId || !amount || amount <= 0 || !currency) {
    return { error: "تأكد من تعبئة العضو والمبلغ والعملة." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "لازم تسجل دخول." };

  // يلي عم يسجل الحركة هو نفسه يلي قبض المبلغ فعليًا (مهم لتقرير تسليم الجابي).
  const { error } = await supabase.from("donations").insert({
    member_id: memberId,
    amount,
    currency,
    note: note || null,
    collected_by: user.id,
    recorded_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return ok;
}

// عضو عادي يصرّح بتبرعه هو بس (تحويل خارجي أو نية تسليم كاش) — بيصير pending
// تلقائيًا (trigger بقاعدة البيانات)، أمين الصندوق يأكده بعدين.
export async function submitMemberDonation(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const amount = Number(formData.get("amount"));
  const currency = String(formData.get("currency") || "");
  const paymentMethodCode = String(formData.get("paymentMethodCode") || "");
  const reference = String(formData.get("reference") || "").trim();
  const proofImage = formData.get("proofImage");

  if (!amount || amount <= 0 || !currency || !paymentMethodCode) {
    return { error: "تأكد من تعبئة المبلغ والعملة وطريقة الدفع." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "لازم تسجل دخول." };

  let proofImagePath: string | null = null;
  if (proofImage instanceof File && proofImage.size > 0) {
    if (proofImage.size > 5 * 1024 * 1024) {
      return { error: "الصورة كبيرة كتير — الحد الأقصى 5 ميغابايت." };
    }
    const ext = proofImage.name.split(".").pop() || "jpg";
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("donation-proofs")
      .upload(path, proofImage, { contentType: proofImage.type });
    if (uploadError) return { error: uploadError.message };
    proofImagePath = path;
  }

  const { error } = await supabase.from("donations").insert({
    member_id: user.id,
    amount,
    currency,
    payment_method_code: paymentMethodCode,
    payment_reference: reference || null,
    proof_image_path: proofImagePath,
    recorded_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return ok;
}

export async function confirmDonation(donationId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("confirm_donation", { donation_id: donationId });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function editDonation(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const id = String(formData.get("id") || "");
  const memberId = String(formData.get("memberId") || "");
  const amount = Number(formData.get("amount"));
  const currency = String(formData.get("currency") || "");
  const note = String(formData.get("note") || "").trim();

  if (!id || !memberId || !amount || amount <= 0 || !currency) {
    return { error: "تأكد من تعبئة العضو والمبلغ والعملة." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("donations")
    .update({
      member_id: memberId,
      amount,
      currency,
      note: note || null,
      edited: true,
      edited_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return ok;
}
