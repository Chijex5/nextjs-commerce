import { Carousel } from "components/carousel";
import { ThreeItemGrid } from "components/grid/three-items";
import { CustomShowcase } from "components/custom-showcase";
import { CollectionSections } from "components/collection-sections";
import Footer from "components/layout/footer";

export const metadata = {
  description:
    "D'FOOTPRINT - Handcrafted footwear including slippers and slides. Premium handmade designs with custom order options. Nationwide delivery across Nigeria.",
  openGraph: {
    type: "website",
  },
};

export default function HomePage() {
  return (
    <>
      <ThreeItemGrid />
      <Carousel />
      <CollectionSections />
      <CustomShowcase />
      <Footer />
    </>
  );
}
