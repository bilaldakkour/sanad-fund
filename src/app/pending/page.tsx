import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PendingScreen } from "./PendingScreen";

export default async function PendingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", user.id)
    .single();

  if (profile?.status === "approved") redirect("/");

  return <PendingScreen status={(profile?.status as "pending" | "rejected" | "removed") ?? "pending"} />;
}
