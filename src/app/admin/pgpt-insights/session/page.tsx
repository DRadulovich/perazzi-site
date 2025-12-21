import { redirect } from "next/navigation";

// Temporary bridge page until a full Sessions index is implemented.
// Keeps the sidebar link stable and ensures users land on the existing
// triage log explorer.
export const dynamic = "force-dynamic";

export default function PgptSessionIndexRedirect() {
  redirect("/admin/pgpt-insights?view=triage#logs");
}
