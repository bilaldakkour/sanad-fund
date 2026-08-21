import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  pending: "قيد الانتظار",
  admin: "مدير",
  treasurer: "أمين الصندوق",
  supervisor: "مشرف",
  collector: "جامع الأموال",
  member: "عضو",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "قيد الانتظار",
  approved: "موافق عليه",
  rejected: "مرفوض",
};

function sheetDate(value: string | null) {
  if (!value) return null;
  return new Date(value);
}

function addSheet(workbook: ExcelJS.Workbook, name: string) {
  const sheet = workbook.addWorksheet(name, { views: [{ rightToLeft: true, state: "frozen", ySplit: 1 }] });
  return sheet;
}

function styleHeader(sheet: ExcelJS.Worksheet) {
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
  header.alignment = { vertical: "middle", horizontal: "right" };
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } };
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: recorderProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!recorderProfile || !["admin", "treasurer"].includes(recorderProfile.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const [
    { data: donations },
    { data: expenses },
    { data: members },
    { data: handovers },
    { data: cases },
    { data: paymentMethods },
    { data: balances },
    { data: edits },
  ] = await Promise.all([
    supabase.from("donations_feed").select("*").order("entry_no", { ascending: true }),
    supabase.from("expenses_feed").select("*").order("entry_no", { ascending: true }),
    supabase.from("profiles").select("*").order("full_name", { ascending: true }),
    supabase.from("handovers_feed").select("*"),
    supabase.from("emergency_cases").select("*").order("created_at", { ascending: false }),
    supabase.from("payment_methods").select("*").order("sort_order", { ascending: true }),
    supabase.from("fund_balances").select("*"),
    supabase.from("donation_edits_feed").select("*"),
  ]);

  const memberNameById = new Map((members ?? []).map((m) => [m.id, m.full_name as string]));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "سَنَد";
  workbook.created = new Date();

  // ---------------------------------------------------------------- الأرصدة
  const balancesSheet = addSheet(workbook, "الأرصدة");
  balancesSheet.columns = [
    { header: "العملة", key: "currency", width: 14 },
    { header: "الرصيد الحالي", key: "balance", width: 18 },
  ];
  (balances ?? []).forEach((b) => balancesSheet.addRow({ currency: b.currency, balance: b.balance }));
  styleHeader(balancesSheet);

  // -------------------------------------------------------------- التبرعات
  const donationsSheet = addSheet(workbook, "التبرعات");
  donationsSheet.columns = [
    { header: "رقم الوصل", key: "entry_no", width: 10 },
    { header: "اسم المتبرع", key: "member_name", width: 22 },
    { header: "المبلغ المحوَّل", key: "gross_amount", width: 16 },
    { header: "الصافي للصندوق", key: "amount", width: 14 },
    { header: "العملة", key: "currency", width: 10 },
    { header: "الحالة", key: "status", width: 14 },
    { header: "طريقة الدفع", key: "payment_method", width: 20 },
    { header: "المرجع", key: "payment_reference", width: 18 },
    { header: "جمعها (جابي)", key: "collected_by_name", width: 18 },
    { header: "سجّلها", key: "recorded_by_name", width: 18 },
    { header: "أكدها", key: "confirmed_by_name", width: 18 },
    { header: "تاريخ التبرع", key: "donated_at", width: 20 },
    { header: "تاريخ التأكيد", key: "confirmed_at", width: 20 },
    { header: "ملاحظة", key: "note", width: 24 },
    { header: "معدّلة؟", key: "edited", width: 10 },
    { header: "تاريخ آخر تعديل", key: "edited_at", width: 20 },
  ];
  (donations ?? []).forEach((d) => {
    donationsSheet.addRow({
      entry_no: d.entry_no,
      member_name: d.member_name,
      gross_amount: d.gross_amount,
      amount: d.amount,
      currency: d.currency,
      status: d.status === "confirmed" ? "مؤكدة" : "قيد التأكيد",
      payment_method:
        d.payment_method_name_ar ?? (d.collected_by ? "جباية يدوية" : "تسجيل مباشر"),
      payment_reference: d.payment_reference,
      collected_by_name: d.collected_by_name,
      recorded_by_name: d.recorded_by_name,
      confirmed_by_name: d.confirmed_by_name,
      donated_at: sheetDate(d.donated_at),
      confirmed_at: sheetDate(d.confirmed_at),
      note: d.note,
      edited: d.edited ? "نعم" : "لا",
      edited_at: sheetDate(d.edited_at),
    });
  });
  donationsSheet.getColumn("donated_at").numFmt = "yyyy-mm-dd hh:mm";
  donationsSheet.getColumn("confirmed_at").numFmt = "yyyy-mm-dd hh:mm";
  donationsSheet.getColumn("edited_at").numFmt = "yyyy-mm-dd hh:mm";
  styleHeader(donationsSheet);

  // -------------------------------------------------------------- المصاريف
  const expensesSheet = addSheet(workbook, "المصاريف");
  expensesSheet.columns = [
    { header: "رقم الوصل", key: "entry_no", width: 10 },
    { header: "العنوان", key: "title", width: 24 },
    { header: "المبلغ", key: "amount", width: 14 },
    { header: "العملة", key: "currency", width: 10 },
    { header: "الحالة", key: "status", width: 16 },
    { header: "موافقة أمين الصندوق", key: "treasurer_approved", width: 18 },
    { header: "موافقة المشرف", key: "supervisor_approved", width: 16 },
    { header: "السبب", key: "reason", width: 24 },
    { header: "الرصيد قبل", key: "balance_before", width: 14 },
    { header: "الرصيد بعد", key: "balance_after", width: 14 },
    { header: "سجّلها", key: "recorded_by_name", width: 18 },
    { header: "تاريخ الصرف", key: "spent_at", width: 20 },
  ];
  (expenses ?? []).forEach((e) => {
    expensesSheet.addRow({
      entry_no: e.entry_no,
      title: e.title,
      amount: e.amount,
      currency: e.currency,
      status: e.status === "approved" ? "معتمد" : "قيد الموافقة",
      treasurer_approved: e.treasurer_approved ? "نعم" : "لا",
      supervisor_approved: e.supervisor_approved ? "نعم" : "لا",
      reason: e.reason,
      balance_before: e.balance_before,
      balance_after: e.balance_after,
      recorded_by_name: e.recorded_by_name,
      spent_at: sheetDate(e.spent_at),
    });
  });
  expensesSheet.getColumn("spent_at").numFmt = "yyyy-mm-dd hh:mm";
  styleHeader(expensesSheet);

  // -------------------------------------------------------------- الأعضاء
  const membersSheet = addSheet(workbook, "الأعضاء");
  membersSheet.columns = [
    { header: "الاسم", key: "full_name", width: 22 },
    { header: "الهاتف", key: "phone", width: 16 },
    { header: "البريد الإلكتروني", key: "email", width: 26 },
    { header: "الدور", key: "role", width: 16 },
    { header: "الحالة", key: "status", width: 14 },
    { header: "تاريخ الانضمام", key: "created_at", width: 20 },
  ];
  (members ?? []).forEach((m) => {
    membersSheet.addRow({
      full_name: m.full_name,
      phone: m.phone,
      email: m.email,
      role: ROLE_LABEL[m.role] ?? m.role,
      status: STATUS_LABEL[m.status] ?? m.status,
      created_at: sheetDate(m.created_at),
    });
  });
  membersSheet.getColumn("created_at").numFmt = "yyyy-mm-dd hh:mm";
  styleHeader(membersSheet);

  // ------------------------------------------------------ دفعات تسليم الجباة
  const handoversSheet = addSheet(workbook, "دفعات التسليم");
  handoversSheet.columns = [
    { header: "الجابي", key: "collector_name", width: 20 },
    { header: "الحالة", key: "status", width: 16 },
    { header: "تاريخ الطلب", key: "created_at", width: 20 },
    { header: "أكدها", key: "confirmed_by_name", width: 18 },
    { header: "تاريخ التأكيد", key: "confirmed_at", width: 20 },
  ];
  (handovers ?? []).forEach((h) => {
    handoversSheet.addRow({
      collector_name: h.collector_name,
      status: h.status === "confirmed" ? "مؤكدة" : "بانتظار التأكيد",
      created_at: sheetDate(h.created_at),
      confirmed_by_name: h.confirmed_by_name,
      confirmed_at: sheetDate(h.confirmed_at),
    });
  });
  handoversSheet.getColumn("created_at").numFmt = "yyyy-mm-dd hh:mm";
  handoversSheet.getColumn("confirmed_at").numFmt = "yyyy-mm-dd hh:mm";
  styleHeader(handoversSheet);

  // -------------------------------------------------------------- الحالات
  const casesSheet = addSheet(workbook, "الحالات الطارئة");
  casesSheet.columns = [
    { header: "العنوان", key: "title", width: 22 },
    { header: "الوصف", key: "description", width: 30 },
    { header: "الحالة", key: "status", width: 12 },
    { header: "المبلغ المستهدف", key: "target_amount", width: 16 },
    { header: "المبلغ المجموع", key: "raised_amount", width: 16 },
    { header: "العملة", key: "currency", width: 10 },
    { header: "أنشأها", key: "created_by_name", width: 18 },
    { header: "تاريخ الإنشاء", key: "created_at", width: 20 },
  ];
  (cases ?? []).forEach((c) => {
    casesSheet.addRow({
      title: c.title,
      description: c.description,
      status: c.status === "open" ? "مفتوحة" : "مغلقة",
      target_amount: c.target_amount,
      raised_amount: c.raised_amount,
      currency: c.currency,
      created_by_name: memberNameById.get(c.created_by) ?? "",
      created_at: sheetDate(c.created_at),
    });
  });
  casesSheet.getColumn("created_at").numFmt = "yyyy-mm-dd hh:mm";
  styleHeader(casesSheet);

  // -------------------------------------------------------------- طرق الدفع
  const methodsSheet = addSheet(workbook, "طرق الدفع");
  methodsSheet.columns = [
    { header: "الرمز", key: "code", width: 16 },
    { header: "الاسم (عربي)", key: "name_ar", width: 20 },
    { header: "الاسم (إنجليزي)", key: "name_en", width: 20 },
    { header: "رقم الحساب/الهاتف", key: "account_number", width: 20 },
    { header: "نسبة الخصم", key: "fee_percent", width: 12 },
    { header: "التعليمات (عربي)", key: "instructions_ar", width: 30 },
    { header: "التعليمات (إنجليزي)", key: "instructions_en", width: 30 },
    { header: "مفعّلة؟", key: "is_active", width: 10 },
  ];
  (paymentMethods ?? []).forEach((m) => {
    methodsSheet.addRow({
      code: m.code,
      name_ar: m.name_ar,
      name_en: m.name_en,
      account_number: m.account_number,
      fee_percent: m.fee_percent,
      instructions_ar: m.instructions_ar,
      instructions_en: m.instructions_en,
      is_active: m.is_active ? "نعم" : "لا",
    });
  });
  styleHeader(methodsSheet);

  // -------------------------------------------------------------- سجل التعديلات
  const editsSheet = addSheet(workbook, "سجل التعديلات");
  editsSheet.columns = [
    { header: "تاريخ التعديل", key: "edited_at", width: 20 },
    { header: "عدّلها", key: "edited_by_name", width: 18 },
    { header: "العضو قبل", key: "old_member_name", width: 20 },
    { header: "العضو بعد", key: "new_member_name", width: 20 },
    { header: "المبلغ قبل", key: "old_amount", width: 14 },
    { header: "المبلغ بعد", key: "new_amount", width: 14 },
    { header: "العملة قبل", key: "old_currency", width: 12 },
    { header: "العملة بعد", key: "new_currency", width: 12 },
    { header: "الملاحظة قبل", key: "old_note", width: 22 },
    { header: "الملاحظة بعد", key: "new_note", width: 22 },
  ];
  (edits ?? []).forEach((e) => {
    editsSheet.addRow({
      edited_at: sheetDate(e.edited_at),
      edited_by_name: e.edited_by_name,
      old_member_name: e.old_member_name,
      new_member_name: e.new_member_name,
      old_amount: e.old_amount,
      new_amount: e.new_amount,
      old_currency: e.old_currency,
      new_currency: e.new_currency,
      old_note: e.old_note,
      new_note: e.new_note,
    });
  });
  editsSheet.getColumn("edited_at").numFmt = "yyyy-mm-dd hh:mm";
  styleHeader(editsSheet);

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `sanad-export-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
