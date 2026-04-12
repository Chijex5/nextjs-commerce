import type { Metadata } from "next";
import AccountNav from "./account-nav";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="mx-auto w-full max-w-[1800px] px-4 pb-16 pt-8 md:px-6 md:pt-10 lg:px-8"
      style={{
        background: "#0A0704",
        color: "#F2E8D5",
      }}
    >
      <div
        className="mb-6 space-y-2 pb-5"
        style={{ borderBottom: "1px solid rgba(242,232,213,0.09)" }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-[0.28em]"
          style={{ color: "#BF5A28" }}
        >
          My account
        </p>
        <h1
          className="text-3xl font-semibold tracking-tight"
          style={{ color: "#F2E8D5" }}
        >
          Account settings
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <AccountNav />

        <section>{children}</section>
      </div>
    </div>
  );
}
