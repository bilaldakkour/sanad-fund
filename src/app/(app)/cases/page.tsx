import { createClient } from "@/lib/supabase/server";
import type { EmergencyCase } from "@/lib/types";
import { CasesClient } from "./CasesClient";

export default async function CasesPage() {
  const supabase = await createClient();
  const { data: cases } = await supabase
    .from("emergency_cases")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<EmergencyCase[]>();

  return <CasesClient cases={cases ?? []} />;
}
