import Footer from "components/layout/footer";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="mx-auto w-full max-w-[1800px] px-4 pb-16 pt-8 md:px-6 md:pt-10 lg:px-8">
        <div className="mx-auto w-full max-w-4xl">{children}</div>
      </div>
      <Footer />
    </>
  );
}
