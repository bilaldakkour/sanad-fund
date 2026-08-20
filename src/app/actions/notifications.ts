"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormActionState } from "@/app/actions/donations";

const ok: FormActionState = { error: null };

export async function sendAnnouncement(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const message = String(formData.get("message") || "").trim();
  if (!message) return { error: "لازم تكتب نص الإشعار." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("send_announcement", { message });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return ok;
}

export async function markNotificationsRead(notificationIds: string[]) {
  if (notificationIds.length === 0) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notification_reads")
    .upsert(
      notificationIds.map((id) => ({ notification_id: id, user_id: user.id })),
      { onConflict: "notification_id,user_id", ignoreDuplicates: true },
    );

  revalidatePath("/", "layout");
}
