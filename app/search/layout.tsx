import Footer from "components/layout/footer";
import Collections from "components/layout/search/collections";
import FilterList from "components/layout/search/filter";
import MobileFilterBar from "components/layout/search/mobile-filter-bar";
import { sorting } from "lib/constants";
import ChildrenWrapper from "./children-wrapper";
import { Suspense } from "react";

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MobileFilterBar>
        <div className="mb-4">
          <Collections />
        </div>
        <FilterList list={sorting} title="Sort by" />
      </MobileFilterBar>
      <div className="mx-auto flex max-w-(--breakpoint-2xl) flex-col gap-8 px-4 pb-4 pt-8 text-black md:flex-row dark:text-white">
        <div className="order-first hidden w-full flex-none md:sticky md:top-24 md:block md:max-w-[125px] md:self-start">
          <Collections />
        </div>
        <div className="order-last min-h-screen w-full md:order-none">
          <Suspense fallback={null}>
            <ChildrenWrapper>{children}</ChildrenWrapper>
          </Suspense>
        </div>
        <div className="order-none hidden flex-none md:sticky md:top-24 md:order-last md:block md:w-[125px] md:self-start">
          <FilterList list={sorting} title="Sort by" />
        </div>
      </div>
      <Footer />
    </>
  );
}
