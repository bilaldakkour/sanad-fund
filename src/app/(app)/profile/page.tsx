import { createClient } from "@/lib/supabase/server";
import { donationToEntry } from "@/lib/types";
import type { DonationFeedRow } from "@/lib/ledger";
import type { Profile } from "@/lib/types";
import { ProfileClient } from "./ProfileClient";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: myDonations }, { data: pendingMembers }] = await Promise.all([
    supabase
      .from("donations_feed")
      .select("*")
      .eq("member_id", user!.id)
      .order("donated_at", { ascending: false })
      .returns<DonationFeedRow[]>(),
    supabase.from("profiles").select("*").eq("status", "pending").order("created_at").returns<Profile[]>(),
  ]);

  const entries = (myDonations ?? []).map((d) =>
    donationToEntry({
      id: d.id,
      entry_no: d.entry_no,
      member_id: d.member_id,
      member_name: d.member_name,
      amount: d.amount,
      currency: d.currency,
      exchange_rate: d.exchange_rate,
      collected_by: d.collected_by,
      collected_by_name: d.collected_by_name,
      recorded_by: d.recorded_by,
      recorded_by_name: d.recorded_by_name,
      note: d.note,
      donated_at: d.donated_at.slice(0, 10),
      edited: d.edited,
      edited_at: d.edited_at,
    }),
  );

  const myByCurrency: Record<string, number> = {};
  entries.forEach((e) => {
    if (e.amount != null) myByCurrency[e.currency] = (myByCurrency[e.currency] || 0) + e.amount;
  });

  return <ProfileClient entries={entries} myByCurrency={myByCurrency} pendingMembers={pendingMembers ?? []} />;
}
