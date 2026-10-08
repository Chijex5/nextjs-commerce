import Footer from "components/layout/footer";
import "../editorial-bridge.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="ed-bridge bg-canvas px-4 pb-24 pt-10 text-fg sm:px-8 sm:pt-14 md:px-12">
        <div className="max-w-4xl">{children}</div>
      </div>
      <Footer />
    </>
  );
}
