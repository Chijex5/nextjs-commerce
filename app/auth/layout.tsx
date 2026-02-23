import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[1800px] px-4 pb-16 pt-8 md:px-6 md:pt-10 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_460px] lg:items-start">
        <section className="rounded-2xl border border-neutral-200 bg-white p-7 dark:border-neutral-800 dark:bg-neutral-950 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
            Welcome
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-4xl">
            Sign in to manage your account, orders, and saved addresses.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-600 dark:text-neutral-400">
            You can continue with a magic link or use your password. Your data
            is secure and available across devices.
          </p>
        </section>

        <section>{children}</section>
      </div>
    </div>
  );
}
