import { createClient } from "@/lib/supabase/server";
import { fetchLedgerEntries } from "@/lib/ledger";
import { LedgerClient } from "./LedgerClient";

export default async function LedgerPage() {
  const supabase = await createClient();
  const entries = await fetchLedgerEntries(supabase, 300);

  return <LedgerClient entries={entries} />;
}
