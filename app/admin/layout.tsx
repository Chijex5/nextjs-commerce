import AdminLayoutShell from "components/admin/AdminLayoutShell";
import { eq } from "drizzle-orm";
import { authOptions } from "lib/auth";
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

  if (session?.user?.id) {
    const [admin] = await db
      .select({
        email: adminUsers.email,
        name: adminUsers.name,
        role: adminUsers.role,
        lastLoginAt: adminUsers.lastLoginAt,
      })
      .from(adminUsers)
      .where(eq(adminUsers.id, session.user.id))
      .limit(1);

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
    <AdminLayoutShell adminProfile={adminProfile}>{children}</AdminLayoutShell>
  );
}
