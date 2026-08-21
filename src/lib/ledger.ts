import type { SupabaseClient } from "@supabase/supabase-js";
import { donationToEntry, expenseToEntry, type LedgerEntry } from "@/lib/types";

export interface DonationFeedRow {
  id: string;
  entry_no: number;
  member_id: string;
  member_name: string;
  amount: number | null;
  gross_amount: number | null;
  currency: string;
  note: string | null;
  donated_at: string;
  edited: boolean;
  edited_at: string | null;
  recorded_by: string;
  recorded_by_name: string;
  collected_by: string | null;
  collected_by_name: string | null;
  exchange_rate: number | null;
  status: "pending" | "confirmed" | "rejected";
  payment_method_code: string | null;
  payment_method_name_ar: string | null;
  payment_method_name_en: string | null;
  payment_method_fee_percent: number | null;
  payment_reference: string | null;
  confirmed_by: string | null;
  confirmed_by_name: string | null;
  confirmed_at: string | null;
  handover_id: string | null;
  proof_image_path: string | null;
  rejection_reason: string | null;
  rejected_by: string | null;
  rejected_by_name: string | null;
  rejected_at: string | null;
}

export interface ExpenseFeedRow {
  id: string;
  entry_no: number;
  title: string;
  amount: number;
  currency: string;
  reason: string | null;
  status: "pending" | "approved";
  treasurer_approved: boolean;
  supervisor_approved: boolean;
  balance_before: number | null;
  balance_after: number | null;
  recorded_by: string;
  recorded_by_name: string;
  spent_at: string;
  exchange_rate: number | null;
  case_id: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchLedgerEntries(supabase: SupabaseClient<any>, limit = 200): Promise<LedgerEntry[]> {
  const [{ data: donations }, { data: expenses }] = await Promise.all([
    supabase
      .from("donations_feed")
      .select("*")
      .order("donated_at", { ascending: false })
      .limit(limit)
      .returns<DonationFeedRow[]>(),
    supabase
      .from("expenses_feed")
      .select("*")
      .order("spent_at", { ascending: false })
      .limit(limit)
      .returns<ExpenseFeedRow[]>(),
  ]);

  const entries: LedgerEntry[] = [
    ...(donations ?? []).map((d) =>
      donationToEntry({
        id: d.id,
        entry_no: d.entry_no,
        member_id: d.member_id,
        member_name: d.member_name,
        amount: d.amount,
        gross_amount: d.gross_amount,
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
        status: d.status,
        payment_method_code: d.payment_method_code,
        payment_method_name_ar: d.payment_method_name_ar,
        payment_method_name_en: d.payment_method_name_en,
        payment_method_fee_percent: d.payment_method_fee_percent,
        payment_reference: d.payment_reference,
        confirmed_by: d.confirmed_by,
        confirmed_by_name: d.confirmed_by_name,
        confirmed_at: d.confirmed_at,
        handover_id: d.handover_id,
        rejection_reason: d.rejection_reason,
        rejected_by: d.rejected_by,
        rejected_by_name: d.rejected_by_name,
        rejected_at: d.rejected_at,
      }),
    ),
    ...(expenses ?? []).map((e) =>
      expenseToEntry({
        id: e.id,
        entry_no: e.entry_no,
        title: e.title,
        amount: e.amount,
        currency: e.currency,
        exchange_rate: e.exchange_rate,
        reason: e.reason,
        case_id: e.case_id,
        status: e.status,
        treasurer_approved: e.treasurer_approved,
        supervisor_approved: e.supervisor_approved,
        balance_before: e.balance_before,
        balance_after: e.balance_after,
        recorded_by: e.recorded_by,
        recorded_by_name: e.recorded_by_name,
        spent_at: e.spent_at.slice(0, 10),
      }),
    ),
  ];

  return entries.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function fetchLedgerEntriesInRange(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  startIso: string,
  endIso: string,
): Promise<LedgerEntry[]> {
  const [{ data: donations }, { data: expenses }] = await Promise.all([
    supabase
      .from("donations_feed")
      .select("*")
      .gte("donated_at", startIso)
      .lt("donated_at", endIso)
      .order("donated_at", { ascending: false })
      .returns<DonationFeedRow[]>(),
    supabase
      .from("expenses_feed")
      .select("*")
      .eq("status", "approved")
      .gte("spent_at", startIso)
      .lt("spent_at", endIso)
      .order("spent_at", { ascending: false })
      .returns<ExpenseFeedRow[]>(),
  ]);

  const entries: LedgerEntry[] = [
    ...(donations ?? []).map((d) =>
      donationToEntry({
        id: d.id,
        entry_no: d.entry_no,
        member_id: d.member_id,
        member_name: d.member_name,
        amount: d.amount,
        gross_amount: d.gross_amount,
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
        status: d.status,
        payment_method_code: d.payment_method_code,
        payment_method_name_ar: d.payment_method_name_ar,
        payment_method_name_en: d.payment_method_name_en,
        payment_method_fee_percent: d.payment_method_fee_percent,
        payment_reference: d.payment_reference,
        confirmed_by: d.confirmed_by,
        confirmed_by_name: d.confirmed_by_name,
        confirmed_at: d.confirmed_at,
        handover_id: d.handover_id,
        rejection_reason: d.rejection_reason,
        rejected_by: d.rejected_by,
        rejected_by_name: d.rejected_by_name,
        rejected_at: d.rejected_at,
      }),
    ),
    ...(expenses ?? []).map((e) =>
      expenseToEntry({
        id: e.id,
        entry_no: e.entry_no,
        title: e.title,
        amount: e.amount,
        currency: e.currency,
        exchange_rate: e.exchange_rate,
        reason: e.reason,
        case_id: e.case_id,
        status: e.status,
        treasurer_approved: e.treasurer_approved,
        supervisor_approved: e.supervisor_approved,
        balance_before: e.balance_before,
        balance_after: e.balance_after,
        recorded_by: e.recorded_by,
        recorded_by_name: e.recorded_by_name,
        spent_at: e.spent_at.slice(0, 10),
      }),
    ),
  ];

  return entries.sort((a, b) => (a.date < b.date ? 1 : -1));
}
