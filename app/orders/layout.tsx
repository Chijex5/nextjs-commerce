import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[1800px] px-4 pb-16 pt-8 md:px-6 md:pt-10 lg:px-8">
      {children}
    </div>
  );
}
