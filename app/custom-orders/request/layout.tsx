import Footer from "components/layout/footer";

export default function CustomOrderRequestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="min-h-[70svh] bg-canvas text-fg">{children}</div>
      <Footer />
    </>
  );
}
