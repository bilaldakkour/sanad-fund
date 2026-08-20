import { createClient } from "@/lib/supabase/server";
import { fetchLedgerEntries } from "@/lib/ledger";
import { HomeClient } from "./HomeClient";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [entries, { data: balances }, { data: myDonations }, { count: approvedMembersCount }, { count: openCasesCount }, { data: monthly }] =
    await Promise.all([
      fetchLedgerEntries(supabase, 6),
      supabase.from("fund_balances").select("*"),
      supabase.from("donations").select("amount, currency").eq("member_id", user!.id),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("emergency_cases").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabase.rpc("monthly_donation_totals"),
    ]);

  const chartData = (monthly ?? []) as { month_start: string; total: number }[];

  return (
    <HomeClient
      balances={balances ?? []}
      recentEntries={entries.slice(0, 4)}
      myDonationCount={myDonations?.length ?? 0}
      approvedMembersCount={approvedMembersCount ?? 0}
      openCasesCount={openCasesCount ?? 0}
      chartData={chartData}
    />
  );
}
