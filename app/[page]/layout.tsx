import Footer from "components/layout/footer";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div
        style={{
          background: "#0A0704",
          minHeight: "100vh",
          paddingTop: "48px",
          paddingBottom: "80px",
        }}
      >
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "0 24px",
          }}
        >
          {children}
        </div>
      </div>
      <Footer />
    </>
  );
}