import { Carousel } from "components/carousel";
import { ThreeItemGrid } from "components/grid/three-items";
import { Hero } from "components/homepage/hero";
import { Features } from "components/homepage/features";
import { Testimonials } from "components/homepage/testimonials";
import { CustomCTA } from "components/homepage/custom-cta";
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
      <Hero />
      <Features />
      <ThreeItemGrid />
      <Carousel />
      <Testimonials />
      <CustomCTA />
      <Footer />
    </>
  );
}
