import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { APPROVER_ROLES, type Role } from "@/lib/types";
import type { DonationFeedRow, ExpenseFeedRow } from "@/lib/ledger";
import { ApprovalsClient } from "./ApprovalsClient";
import type { PendingHandoverBatch } from "./ApprovalsClient";

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (!APPROVER_ROLES.includes((profile?.role as Role) ?? "member")) redirect("/");

  const [{ data: pendingExpenses }, { data: pendingDonations }, { data: pendingHandovers }] = await Promise.all([
    supabase
      .from("expenses_feed")
      .select("*")
      .eq("status", "pending")
      .order("spent_at", { ascending: false })
      .returns<ExpenseFeedRow[]>(),
    supabase
      .from("donations_feed")
      .select("*")
      .eq("status", "pending")
      .is("collected_by", null)
      .order("donated_at", { ascending: false })
      .returns<DonationFeedRow[]>(),
    supabase.from("handovers_feed").select("*").eq("status", "pending"),
  ]);

  const handoverIds = (pendingHandovers ?? []).map((h) => h.id);
  const { data: handoverDonationRows } =
    handoverIds.length > 0
      ? await supabase.from("donations").select("amount, currency, handover_id").in("handover_id", handoverIds)
      : { data: [] as { amount: number; currency: string; handover_id: string }[] };

  const handoverBatches: PendingHandoverBatch[] = (pendingHandovers ?? []).map((h) => {
    const rows = (handoverDonationRows ?? []).filter((r) => r.handover_id === h.id);
    const totalsMap: Record<string, number> = {};
    rows.forEach((r) => {
      totalsMap[r.currency] = (totalsMap[r.currency] || 0) + r.amount;
    });
    return {
      id: h.id,
      collector_name: h.collector_name,
      created_at: h.created_at.slice(0, 10),
      totals: Object.entries(totalsMap).map(([currency, amount]) => ({ currency, amount })),
      count: rows.length,
    };
  });

  return (
    <ApprovalsClient
      expenses={pendingExpenses ?? []}
      donations={pendingDonations ?? []}
      handoverBatches={handoverBatches}
    />
  );
}
