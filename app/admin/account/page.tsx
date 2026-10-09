import { AccountForms } from "components/admin/team/account-forms";
import {
  Page,
  PageHeader,
  Panel,
  StatList,
  StatRow,
} from "components/admin/ui";
import { eq } from "drizzle-orm";
import { shortDate, timeAgo } from "lib/admin/format";
import { authOptions } from "lib/auth";
import { db } from "lib/db";
import { adminUsers } from "lib/db/schema";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/admin/login");

  const [me] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, session.user.id))
    .limit(1);
  if (!me) redirect("/admin/login");

  return (
    <Page>
      <PageHeader
        eyebrow="Settings"
        title="Account"
        description="Your own sign-in details."
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <AccountForms name={me.name ?? ""} email={me.email} />
        <aside className="space-y-6">
          <Panel title="About you">
            <StatList>
              <StatRow
                label="Role"
                value={me.role === "super_admin" ? "Owner" : "Staff"}
              />
              <StatRow label="Member since" value={shortDate(me.createdAt)} />
              <StatRow
                label="Last sign-in"
                value={me.lastLoginAt ? timeAgo(me.lastLoginAt) : "—"}
              />
            </StatList>
            <Link
              href={`/admin/admins/${me.id}`}
              className="label mt-4 inline-block text-fg-3 hover:text-fg"
            >
              Your activity →
            </Link>
          </Panel>
        </aside>
      </div>
    </Page>
  );
}
