"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormActionState } from "@/app/actions/donations";

const ok: FormActionState = { error: null };

export async function requestPickup(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const amount = Number(formData.get("amount"));
  const currency = String(formData.get("currency") || "");

  if (!amount || amount <= 0 || !currency) {
    return { error: "تأكد من تعبئة المبلغ والعملة." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("request_pickup", { amount, currency });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return ok;
}

export async function cancelPickupRequest(requestId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_pickup_request", { request_id: requestId });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export interface CollectedPickup {
  donation_id: string;
  entry_no: number;
  donated_at: string;
}

export async function collectPickupRequest(requestId: string): Promise<CollectedPickup> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("collect_pickup_request", { request_id: requestId })
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  return data as CollectedPickup;
}
