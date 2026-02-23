import Footer from "components/layout/footer";
import { Suspense } from "react";
import ChildrenWrapper from "./children-wrapper";

export default async function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="mx-auto w-full max-w-[1800px] px-4 pb-16 pt-8 text-black md:px-6 md:pt-10 lg:px-8 dark:text-white">
        <Suspense fallback={null}>
          <ChildrenWrapper>{children}</ChildrenWrapper>
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
