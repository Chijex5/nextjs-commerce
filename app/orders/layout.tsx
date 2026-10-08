import Footer from "components/layout/footer";
import "../account/account.css";

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="account-shell bg-canvas text-fg">{children}</div>
      <Footer />
    </>
  );
}
