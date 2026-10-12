import { RequestDetail } from "components/admin/custom-requests/request-detail";
import { authOptions } from "lib/auth";
import { getCustomOrderSettings } from "lib/custom-orders/settings";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { loadRequests } from "../data";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CustomRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");
  if (process.env.CUSTOM_ORDER_REQUESTS_ENABLED !== "true") notFound();

  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const [[request], settings] = await Promise.all([
    loadRequests(id),
    getCustomOrderSettings(),
  ]);
  if (!request) notFound();

  return <RequestDetail request={request} settings={settings} />;
}
