import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchLedgerEntriesInRange } from "@/lib/ledger";
import { addDays, computeRange, parseDateInput, type PeriodType } from "@/lib/period";
import { REPORT_ROLES, type Role } from "@/lib/types";
import { ReportsClient } from "./ReportsClient";

export interface MonthlyReportRow {
  currency: string;
  opening_balance: number;
  donations_total: number;
  donations_count: number;
  expenses_total: number;
  expenses_count: number;
  closing_balance: number;
}

const VALID_PERIODS: PeriodType[] = ["day", "week", "month", "custom"];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; anchor?: string; end?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: viewerProfile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (!REPORT_ROLES.includes((viewerProfile?.role as Role) ?? "member")) redirect("/");

  const params = await searchParams;
  const period: PeriodType = VALID_PERIODS.includes(params.period as PeriodType)
    ? (params.period as PeriodType)
    : "month";

  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const anchor = params.anchor ? parseDateInput(params.anchor) : todayUtc;
  const customEnd = params.end ? parseDateInput(params.end) : undefined;

  const { start, end } = computeRange(period, anchor, customEnd);
  const rangeStartIso = start.toISOString();
  const rangeEndIso = addDays(end, 1).toISOString(); // exclusive upper bound

  const [{ data: report }, entries] = await Promise.all([
    supabase.rpc("period_report", {
      p_start: start.toISOString().slice(0, 10),
      p_end: end.toISOString().slice(0, 10),
    }),
    fetchLedgerEntriesInRange(supabase, rangeStartIso, rangeEndIso),
  ]);

  return (
    <ReportsClient
      period={period}
      anchor={anchor.toISOString().slice(0, 10)}
      start={start.toISOString().slice(0, 10)}
      end={end.toISOString().slice(0, 10)}
      report={(report ?? []) as MonthlyReportRow[]}
      entries={entries}
    />
  );
}
