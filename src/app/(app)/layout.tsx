import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppDataProvider } from "@/lib/AppDataProvider";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { RealtimeRefresher } from "@/components/RealtimeRefresher";
import type { AppNotification, Currency, FundSettings, PaymentMethod, Profile } from "@/lib/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile || profile.status !== "approved") redirect("/pending");

  const [
    { data: currencies },
    { data: settings },
    { data: notifications },
    { data: approvedMembers },
    { data: unreadCount },
    { data: paymentMethods },
  ] = await Promise.all([
    supabase.from("currencies").select("*").returns<Currency[]>(),
    supabase.from("fund_settings").select("*").eq("id", 1).single<FundSettings>(),
    supabase
      .from("notifications_feed")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30)
      .returns<AppNotification[]>(),
    supabase
      .from("profiles")
      .select("*")
      .eq("status", "approved")
      .order("full_name")
      .returns<Profile[]>(),
    supabase.rpc("unread_notifications_count"),
    supabase.from("payment_methods").select("*").order("sort_order").returns<PaymentMethod[]>(),
  ]);

  return (
    <AppDataProvider
      value={{
        profile,
        currencies: currencies ?? [],
        settings: settings as FundSettings,
        notifications: notifications ?? [],
        unreadCount: unreadCount ?? 0,
        approvedMembers: approvedMembers ?? [],
        paymentMethods: paymentMethods ?? [],
      }}
    >
      <RealtimeRefresher />
      <Header />
      {/* ملاحظة: main نفسها ما إلها print:hidden كرمال محتوى قابل للطباعة (وصل، تقرير)
          يلي منجوّاها يظل يطبع — كل صفحة بتخبي محتواها العادي بـ print:hidden بنفسها. */}
      <main className="max-w-lg mx-auto px-4 pb-24 pt-4 print:max-w-none print:p-0">{children}</main>
      <BottomNav />
    </AppDataProvider>
  );
}
