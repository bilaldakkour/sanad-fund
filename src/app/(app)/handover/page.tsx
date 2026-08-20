import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HANDOVER_ROLES, type Role } from "@/lib/types";
import { HandoverClient } from "./HandoverClient";

export interface HandoverDonation {
  id: string;
  entry_no: number;
  member_name: string;
  amount: number;
  currency: string;
  note: string | null;
  donated_at: string;
}

export interface HandoverBatch {
  id: string;
  status: "pending" | "confirmed";
  created_at: string;
  confirmed_by_name: string | null;
  confirmed_at: string | null;
  totals: { currency: string; amount: number }[];
  donations: HandoverDonation[];
}

export default async function HandoverPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: viewerProfile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (!HANDOVER_ROLES.includes((viewerProfile?.role as Role) ?? "member")) redirect("/");

  const [{ data: pendingRows }, { data: batchRows }] = await Promise.all([
    supabase
      .from("donations")
      .select("id, entry_no, member_id, amount, currency, note, donated_at")
      .eq("collected_by", user!.id)
      .eq("status", "pending")
      .is("handover_id", null)
      .order("donated_at", { ascending: false }),
    supabase.from("handovers_feed").select("*").eq("collector_id", user!.id),
  ]);

  const batchIds = (batchRows ?? []).map((b) => b.id);
  const { data: batchDonationRows } =
    batchIds.length > 0
      ? await supabase
          .from("donations")
          .select("id, entry_no, member_id, amount, currency, note, donated_at, handover_id")
          .in("handover_id", batchIds)
      : { data: [] as { id: string; entry_no: number; member_id: string; amount: number; currency: string; note: string | null; donated_at: string; handover_id: string }[] };

  const memberIds = [
    ...new Set([
      ...(pendingRows ?? []).map((r) => r.member_id),
      ...(batchDonationRows ?? []).map((r) => r.member_id),
    ]),
  ];
  const { data: members } =
    memberIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", memberIds)
      : { data: [] as { id: string; full_name: string }[] };
  const nameById = new Map((members ?? []).map((m) => [m.id, m.full_name]));

  const pendingDonations: HandoverDonation[] = (pendingRows ?? []).map((r) => ({
    id: r.id,
    entry_no: r.entry_no,
    member_name: nameById.get(r.member_id) ?? "—",
    amount: r.amount,
    currency: r.currency,
    note: r.note,
    donated_at: r.donated_at.slice(0, 10),
  }));

  const batches: HandoverBatch[] = (batchRows ?? [])
    .map((b) => {
      const rows = (batchDonationRows ?? []).filter((r) => r.handover_id === b.id);
      const totalsMap: Record<string, number> = {};
      rows.forEach((r) => {
        totalsMap[r.currency] = (totalsMap[r.currency] || 0) + r.amount;
      });
      return {
        id: b.id,
        status: b.status,
        created_at: b.created_at.slice(0, 10),
        confirmed_by_name: b.confirmed_by_name,
        confirmed_at: b.confirmed_at ? b.confirmed_at.slice(0, 10) : null,
        totals: Object.entries(totalsMap).map(([currency, amount]) => ({ currency, amount })),
        donations: rows
          .map((r) => ({
            id: r.id,
            entry_no: r.entry_no,
            member_name: nameById.get(r.member_id) ?? "—",
            amount: r.amount,
            currency: r.currency,
            note: r.note,
            donated_at: r.donated_at.slice(0, 10),
          }))
          .sort((a, b2) => (a.donated_at < b2.donated_at ? 1 : -1)),
      };
    })
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return <HandoverClient pendingDonations={pendingDonations} batches={batches} />;
}
