import Footer from "components/layout/footer";
import "../../editorial-bridge.css";

export default function CustomOrderRequestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="ed-bridge">{children}</div>
      <Footer />
    </>
  );
}
