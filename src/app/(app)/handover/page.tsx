import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HANDOVER_ROLES, type Role } from "@/lib/types";
import { addDays, parseDateInput, toDateInput } from "@/lib/period";
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

export default async function HandoverPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();
  if (!HANDOVER_ROLES.includes((viewerProfile?.role as Role) ?? "member")) redirect("/");

  const params = await searchParams;
  const today = toDateInput(new Date());
  const from = params.from || today;
  const to = params.to || today;
  const rangeEndIso = addDays(parseDateInput(to), 1).toISOString();

  const { data: rows } = await supabase
    .from("donations")
    .select("id, entry_no, member_id, amount, currency, note, donated_at")
    .eq("collected_by", user!.id)
    .gte("donated_at", parseDateInput(from).toISOString())
    .lt("donated_at", rangeEndIso)
    .order("donated_at", { ascending: false });

  const memberIds = [...new Set((rows ?? []).map((r) => r.member_id))];
  const { data: members } =
    memberIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", memberIds)
      : { data: [] as { id: string; full_name: string }[] };
  const nameById = new Map((members ?? []).map((m) => [m.id, m.full_name]));

  const donations: HandoverDonation[] = (rows ?? []).map((r) => ({
    id: r.id,
    entry_no: r.entry_no,
    member_name: nameById.get(r.member_id) ?? "—",
    amount: r.amount,
    currency: r.currency,
    note: r.note,
    donated_at: r.donated_at.slice(0, 10),
  }));

  return <HandoverClient from={from} to={to} donations={donations} />;
}
