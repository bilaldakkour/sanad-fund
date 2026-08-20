import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { APPROVER_ROLES, type Role } from "@/lib/types";
import type { ExpenseFeedRow } from "@/lib/ledger";
import { ApprovalsClient } from "./ApprovalsClient";

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (!APPROVER_ROLES.includes((profile?.role as Role) ?? "member")) redirect("/");

  const { data: pendingExpenses } = await supabase
    .from("expenses_feed")
    .select("*")
    .eq("status", "pending")
    .order("spent_at", { ascending: false })
    .returns<ExpenseFeedRow[]>();

  return <ApprovalsClient expenses={pendingExpenses ?? []} />;
}
