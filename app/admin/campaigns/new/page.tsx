import { redirect } from "next/navigation";

// Create a new campaign by going to edit with special ID "new"
export default function NewCampaignPage() {
  // Note: The [id]/edit/page.tsx handles both new and edit cases
  // This page just ensures we hit the right route
  redirect("/admin/campaigns/new/edit");
}
