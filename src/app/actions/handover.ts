"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function requestHandover() {
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_handover");
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function confirmHandover(handoverId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("confirm_handover", { handover_id_param: handoverId });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
