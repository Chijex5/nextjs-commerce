import Footer from "components/layout/footer";
import "../../account/account.css";

export default function OrderLayout({
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
