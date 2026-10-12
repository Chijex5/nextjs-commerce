import { CustomOrderSettingsForm } from "components/admin/custom-requests/custom-settings";
import { Page, PageHeader } from "components/admin/ui";
import { authOptions } from "lib/auth";
import { listEditOptions } from "lib/custom-orders/edits";
import { getCustomOrderSettings } from "lib/custom-orders/settings";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CustomOrderSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const [options, settings] = await Promise.all([
    listEditOptions({ activeOnly: false }),
    getCustomOrderSettings(),
  ]);

  return (
    <Page>
      <PageHeader
        eyebrow={
          <Link href="/admin/custom-order-requests" className="hover:text-fg">
            ← Custom requests
          </Link>
        }
        title="Edit menu & settings"
        description="The changes customers can pick when customising a design, and the rules used to price them. Customers see an estimate straight away; you still approve every request."
      />
      <CustomOrderSettingsForm options={options} settings={settings} />
    </Page>
  );
}
