import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

// هذا الـ endpoint ما بيناديه إلا trigger من قاعدة البيانات (عبر pg_net) لما
// ينضاف إشعار مستهدف لأمين الصندوق أو المدير — شوف
// supabase/19_email_notifications.sql. محمي بسر مشترك بالهيدر، مش بجلسة
// مستخدم، فمنستخدم service role هون تحديدًا (الاستثناء الوحيد بالمشروع كله)
// لأنو ما في auth.uid() نرجع له أصلًا.
export async function POST(request: Request) {
  const secret = request.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.NOTIFY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { message_ar, message_en, target_role } = await request.json();
  if (!target_role || !["admin", "treasurer"].includes(target_role)) {
    return NextResponse.json({ error: "ignored" }, { status: 200 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!resendKey || !serviceRoleKey) {
    return NextResponse.json({ error: "email not configured" }, { status: 200 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);
  const { data: recipients } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("role", target_role)
    .eq("status", "approved");

  if (!recipients || recipients.length === 0) {
    return NextResponse.json({ error: "no recipients" }, { status: 200 });
  }

  const resend = new Resend(resendKey);
  const from = process.env.NOTIFY_FROM_EMAIL || "سَنَد <onboarding@resend.dev>";

  await Promise.all(
    recipients.map((r) =>
      resend.emails.send({
        from,
        to: r.email,
        subject: "🔔 إشعار جديد من سَنَد",
        html: `
          <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #0f172a;">
            <p style="font-size: 18px; font-weight: bold; margin: 0 0 12px;">سَنَد</p>
            <p style="font-size: 15px; line-height: 1.7; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 14px 16px; margin: 0 0 16px;">${message_ar}</p>
            <a href="https://sanad-fund.vercel.app" style="display: inline-block; background: #ea580c; color: #ffffff; text-decoration: none; font-weight: bold; padding: 10px 20px; border-radius: 10px; font-size: 14px;">فتح التطبيق</a>
            <p style="font-size: 11px; color: #94a3b8; margin-top: 24px;">${message_en}</p>
          </div>
        `,
      }),
    ),
  );

  return NextResponse.json({ ok: true, sent: recipients.length });
}
