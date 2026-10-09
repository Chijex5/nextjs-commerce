import AdminLayoutShell from "components/admin/AdminLayoutShell";
import { eq } from "drizzle-orm";
import { authOptions } from "lib/auth";
import { getNavBadges, type NavBadges } from "lib/admin/metrics";
import { isMockData } from "lib/data/source";
import { db } from "lib/db";
import { adminUsers } from "lib/db/schema";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  let adminProfile: {
    name: string | null;
    email: string;
    role: string;
    lastLoginAt: string | null;
  } | null = null;
  let badges: NavBadges | undefined;

  if (session?.user?.id && isMockData) {
    // Mock mode has no database; show a placeholder profile in the shell.
    adminProfile = {
      name: "Demo Admin",
      email: session.user.email ?? "admin@example.com",
      role: session.user.role ?? "admin",
      lastLoginAt: null,
    };
  } else if (session?.user?.id) {
    const [[admin], navBadges] = await Promise.all([
      db
        .select({
          email: adminUsers.email,
          name: adminUsers.name,
          role: adminUsers.role,
          lastLoginAt: adminUsers.lastLoginAt,
        })
        .from(adminUsers)
        .where(eq(adminUsers.id, session.user.id))
        .limit(1),
      // Badges are a nicety; never let them take the admin down.
      getNavBadges().catch(() => undefined),
    ]);
    badges = navBadges;

    if (admin) {
      adminProfile = {
        name: admin.name,
        email: admin.email,
        role: admin.role,
        lastLoginAt: admin.lastLoginAt?.toISOString() || null,
      };
    }
  }

  return (
    <AdminLayoutShell adminProfile={adminProfile} badges={badges}>
      {children}
    </AdminLayoutShell>
  );
}
