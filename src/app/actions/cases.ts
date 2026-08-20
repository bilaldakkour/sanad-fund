"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormActionState } from "@/app/actions/donations";

const ok: FormActionState = { error: null };

export async function addCase(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const targetAmount = Number(formData.get("targetAmount")) || null;
  const currency = String(formData.get("currency") || "USD");

  if (!title) return { error: "لازم تحط عنوان الحالة." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "لازم تسجل دخول." };

  const { error } = await supabase.from("emergency_cases").insert({
    title,
    description: description || null,
    target_amount: targetAmount,
    currency,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/cases");
  return ok;
}

export async function closeCase(caseId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("emergency_cases").update({ status: "closed" }).eq("id", caseId);
  if (error) throw new Error(error.message);
  revalidatePath("/cases");
}
