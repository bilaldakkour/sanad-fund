import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { APPROVER_ROLES, type Role } from "@/lib/types";
import type { DonationFeedRow, ExpenseFeedRow } from "@/lib/ledger";
import type { HandoverDonation } from "../handover/page";
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

  const donationsWithProof = await Promise.all(
    (pendingDonations ?? []).map(async (d) => {
      if (!d.proof_image_path) return { ...d, proofImageUrl: null };
      const { data } = await supabase.storage
        .from("donation-proofs")
        .createSignedUrl(d.proof_image_path, 3600);
      return { ...d, proofImageUrl: data?.signedUrl ?? null };
    }),
  );

  const handoverIds = (pendingHandovers ?? []).map((h) => h.id);
  const { data: handoverDonationRows } =
    handoverIds.length > 0
      ? await supabase
          .from("donations")
          .select("id, entry_no, member_id, amount, currency, note, donated_at, handover_id")
          .in("handover_id", handoverIds)
      : {
          data: [] as {
            id: string;
            entry_no: number;
            member_id: string;
            amount: number;
            currency: string;
            note: string | null;
            donated_at: string;
            handover_id: string;
          }[],
        };

  const donorIds = [...new Set((handoverDonationRows ?? []).map((r) => r.member_id))];
  const { data: donors } =
    donorIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", donorIds)
      : { data: [] as { id: string; full_name: string }[] };
  const donorNameById = new Map((donors ?? []).map((d) => [d.id, d.full_name]));

  const handoverBatches: PendingHandoverBatch[] = (pendingHandovers ?? []).map((h) => {
    const rows = (handoverDonationRows ?? []).filter((r) => r.handover_id === h.id);
    const totalsMap: Record<string, number> = {};
    rows.forEach((r) => {
      totalsMap[r.currency] = (totalsMap[r.currency] || 0) + r.amount;
    });
    const donations: HandoverDonation[] = rows
      .map((r) => ({
        id: r.id,
        entry_no: r.entry_no,
        member_name: donorNameById.get(r.member_id) ?? "—",
        amount: r.amount,
        currency: r.currency,
        note: r.note,
        donated_at: r.donated_at.slice(0, 10),
      }))
      .sort((a, b) => (a.donated_at < b.donated_at ? 1 : -1));
    return {
      id: h.id,
      collector_name: h.collector_name,
      created_at: h.created_at.slice(0, 10),
      totals: Object.entries(totalsMap).map(([currency, amount]) => ({ currency, amount })),
      count: rows.length,
      donations,
    };
  });

  return (
    <ApprovalsClient
      expenses={pendingExpenses ?? []}
      donations={donationsWithProof}
      handoverBatches={handoverBatches}
    />
  );
}
