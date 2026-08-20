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
