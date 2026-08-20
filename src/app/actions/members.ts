"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export async function approveMember(memberId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_member", { target: memberId });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function rejectMember(memberId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_member", { target: memberId });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function setMemberRole(memberId: string, role: Role) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_member_role", { target: memberId, new_role: role });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function removeMember(memberId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_member", { target: memberId });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
