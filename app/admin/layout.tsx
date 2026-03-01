import type { Metadata } from "next";
import AdminLayoutShell from "components/admin/AdminLayoutShell";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
