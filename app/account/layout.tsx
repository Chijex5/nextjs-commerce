import Footer from "components/layout/footer";
import type { Metadata } from "next";
import AccountNav from "./account-nav";
import "./account.css";

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="account-shell bg-canvas text-fg">
        <header className="px-4 pt-10 sm:px-8 sm:pt-14 md:px-12">
          <p className="label mb-4 text-fg-3">(Account)</p>
          <h1 className="display text-[clamp(3.4rem,11vw,8rem)]">
            Your account
          </h1>
        </header>
        <AccountNav />
        <section className="px-4 pb-20 pt-8 sm:px-8 md:px-12">
          {children}
        </section>
      </div>
      <Footer />
    </>
  );
}
