import {
  TeamManager,
  type TeamMember,
} from "components/admin/team/team-manager";
import { Page, PageHeader } from "components/admin/ui";
import { asc, desc, sql } from "drizzle-orm";
import { authOptions } from "lib/auth";
import { db } from "lib/db";
import { adminUsers } from "lib/db/schema";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const [rows, activity] = await Promise.all([
    db
      .select()
      .from(adminUsers)
      .orderBy(desc(adminUsers.isActive), asc(adminUsers.name)),
    db.execute(sql`
      select lower(acknowledged_by) as email, count(*) as confirmed, max(acknowledged_at)::text as last
      from orders where acknowledged_by is not null
        and acknowledged_at >= (now() at time zone 'UTC') - interval '30 days'
      group by 1
    `) as unknown as Promise<
      Array<{ email: string; confirmed: unknown; last: string | null }>
    >,
  ]);
  const byEmail = new Map(activity.map((a) => [a.email, a]));

  const members: TeamMember[] = rows.map((a) => ({
    id: a.id,
    email: a.email,
    name: a.name,
    role: a.role,
    active: a.isActive,
    lastLoginAt: a.lastLoginAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
    confirmed30d: Number(byEmail.get(a.email.toLowerCase())?.confirmed ?? 0),
    isYou: a.id === session.user?.id,
  }));

  return (
    <Page>
      <PageHeader
        eyebrow="Settings"
        title="Team"
        description="People who can sign in to this admin. Owners can add, edit and remove team members; staff can do everything else."
      />
      <TeamManager
        members={members}
        canManage={session.user?.role === "super_admin"}
      />
    </Page>
  );
}
