import Footer from "components/layout/footer";
import SearchToolbar from "components/layout/search/search-toolbar";
import { sorting } from "lib/constants";
import { getCollections } from "lib/database";
import { Suspense } from "react";
import ChildrenWrapper from "./children-wrapper";

export default async function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const collections = await getCollections();

  return (
    <>
      <Suspense fallback={null}>
        <SearchToolbar collections={collections} sorting={sorting} />
      </Suspense>
      <main className="mx-auto w-full max-w-(--breakpoint-2xl) px-4 pb-16 pt-10 text-black dark:text-white">
        <Suspense fallback={null}>
          <ChildrenWrapper>{children}</ChildrenWrapper>
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
