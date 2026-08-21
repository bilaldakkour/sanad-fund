export type Lang = "ar" | "en";

export type Role =
  | "pending"
  | "admin"
  | "treasurer"
  | "supervisor"
  | "collector"
  | "member";

export type MemberStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  role: Role;
  status: MemberStatus;
  created_at: string;
}

export interface Currency {
  code: string;
  symbol: string;
}

export type DonationStatus = "pending" | "confirmed" | "rejected";

export interface Donation {
  id: string;
  entry_no: number;
  member_id: string;
  member_name: string;
  amount: number | null; // null means hidden by privacy rules
  gross_amount: number | null; // what the donor actually transferred, before payment-method fees
  currency: string;
  exchange_rate: number | null;
  collected_by: string | null;
  collected_by_name: string | null;
  recorded_by: string;
  recorded_by_name: string;
  note: string | null;
  donated_at: string;
  edited: boolean;
  edited_at: string | null;
  status: DonationStatus;
  payment_method_code: string | null;
  payment_method_name_ar: string | null;
  payment_method_name_en: string | null;
  payment_method_fee_percent: number | null;
  payment_reference: string | null;
  confirmed_by: string | null;
  confirmed_by_name: string | null;
  confirmed_at: string | null;
  handover_id: string | null;
  proof_image_path?: string | null;
  rejection_reason: string | null;
  rejected_by: string | null;
  rejected_by_name: string | null;
  rejected_at: string | null;
}

export interface PaymentMethod {
  code: string;
  name_ar: string;
  name_en: string;
  instructions_ar: string | null;
  instructions_en: string | null;
  icon_path: string | null;
  account_number: string | null;
  fee_percent: number;
  is_active: boolean;
  sort_order: number;
}

export interface Handover {
  id: string;
  collector_id: string;
  collector_name: string;
  status: "pending" | "confirmed";
  created_at: string;
  confirmed_by: string | null;
  confirmed_by_name: string | null;
  confirmed_at: string | null;
}

export type ExpenseStatus = "pending" | "approved";

export interface Expense {
  id: string;
  entry_no: number;
  title: string;
  amount: number;
  currency: string;
  exchange_rate: number | null;
  reason: string | null;
  case_id: string | null;
  status: ExpenseStatus;
  treasurer_approved: boolean;
  supervisor_approved: boolean;
  balance_before: number | null;
  balance_after: number | null;
  recorded_by: string;
  recorded_by_name: string;
  spent_at: string;
}

export type CaseStatus = "open" | "closed";

export interface EmergencyCase {
  id: string;
  title: string;
  description: string | null;
  status: CaseStatus;
  target_amount: number | null;
  raised_amount: number;
  currency: string;
  created_by: string;
  created_at: string;
}

export interface FundSettings {
  id: number;
  org_name_ar: string;
  org_name_en: string;
  tagline_ar: string;
  tagline_en: string;
  thank_you_ar: string;
  thank_you_en: string;
  hide_amounts: boolean;
}

export interface DonationEdit {
  id: string;
  donation_id: string;
  edited_at: string;
  edited_by_name: string;
  old_member_name: string | null;
  new_member_name: string | null;
  old_amount: number;
  new_amount: number;
  old_currency: string;
  new_currency: string;
  old_note: string | null;
  new_note: string | null;
}

export interface AppNotification {
  id: string;
  message_ar: string;
  message_en: string;
  created_at: string;
  sender_id: string | null;
  sender_name: string | null;
  link: string | null;
}

export const FULL_VISIBILITY_ROLES: Role[] = ["admin", "treasurer", "supervisor"];
export const APPROVER_ROLES: Role[] = ["treasurer", "supervisor", "admin"];
export const REPORT_ROLES: Role[] = ["admin", "treasurer", "supervisor"];
export const ANNOUNCEMENT_ROLES: Role[] = ["admin", "treasurer", "supervisor"];
export const HANDOVER_ROLES: Role[] = ["collector", "admin"];

// Unified shape the UI renders — donations and expenses both map into this.
export interface LedgerEntry {
  id: string;
  entryNo: number;
  type: "donation" | "expense";
  status: "approved" | "pending" | "rejected";
  personName: string;
  isMine: boolean;
  amount: number | null; // null = hidden by privacy rules
  grossAmount?: number | null; // what the donor transferred, before payment-method fees
  currency: string;
  note: string;
  date: string;
  recordedByName: string;
  edited?: boolean;
  editedAt?: string | null;
  approvals?: { treasurer: boolean; supervisor: boolean };
  balanceBefore?: number | null;
  balanceAfter?: number | null;
  paymentMethodNameAr?: string | null;
  paymentMethodNameEn?: string | null;
  paymentMethodFeePercent?: number | null;
  paymentReference?: string | null;
  rejectionReason?: string | null;
  rejectedByName?: string | null;
  rejectedAt?: string | null;
}

export function donationToEntry(d: Donation): LedgerEntry {
  return {
    id: d.id,
    entryNo: d.entry_no,
    type: "donation",
    status: d.status === "confirmed" ? "approved" : d.status === "rejected" ? "rejected" : "pending",
    personName: d.member_name,
    isMine: false,
    amount: d.amount,
    grossAmount: d.gross_amount,
    currency: d.currency,
    note: d.note || "—",
    date: d.donated_at,
    recordedByName: d.recorded_by_name,
    edited: d.edited,
    editedAt: d.edited_at,
    paymentMethodNameAr: d.payment_method_name_ar,
    paymentMethodNameEn: d.payment_method_name_en,
    paymentMethodFeePercent: d.payment_method_fee_percent,
    paymentReference: d.payment_reference,
    rejectionReason: d.rejection_reason,
    rejectedByName: d.rejected_by_name,
    rejectedAt: d.rejected_at,
  };
}

export function expenseToEntry(e: Expense): LedgerEntry {
  return {
    id: e.id,
    entryNo: e.entry_no,
    type: "expense",
    status: e.status,
    personName: e.title,
    isMine: false,
    amount: e.amount,
    currency: e.currency,
    note: e.reason || "—",
    date: e.spent_at,
    recordedByName: e.recorded_by_name,
    approvals: { treasurer: e.treasurer_approved, supervisor: e.supervisor_approved },
    balanceBefore: e.balance_before,
    balanceAfter: e.balance_after,
  };
}
