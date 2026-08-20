"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormActionState } from "@/app/actions/donations";

const ok: FormActionState = { error: null };

export async function addExpense(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const title = String(formData.get("title") || "").trim();
  const amount = Number(formData.get("amount"));
  const currency = String(formData.get("currency") || "");
  const reason = String(formData.get("reason") || "").trim();
  const caseId = String(formData.get("caseId") || "") || null;

  if (!title || !amount || amount <= 0 || !currency) {
    return { error: "تأكد من تعبئة السبب والمبلغ والعملة." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "لازم تسجل دخول." };

  const { error } = await supabase.from("expenses").insert({
    title,
    amount,
    currency,
    reason: reason || null,
    case_id: caseId,
    recorded_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return ok;
}

export async function approveExpense(expenseId: string, asRole: "treasurer" | "supervisor") {
  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_expense", { expense_id: expenseId, as_role: asRole });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
