import { Carousel } from "components/carousel";
import { ThreeItemGrid } from "components/grid/three-items";
import { CustomShowcase } from "components/custom-showcase";
import { CollectionSections } from "components/collection-sections";
import { TestimonialsCarousel } from "components/testimonials-carousel";
import { TrustBadges } from "components/trust-badges";
import Footer from "components/layout/footer";
import { db } from "lib/db";
import { customOrders } from "lib/db/schema";
import { canonicalUrl, siteName } from "lib/seo";
import { asc, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";

const description =
  "D'FOOTPRINT - Handcrafted footwear including slippers and slides. Premium handmade designs with custom order options. Nationwide delivery across Nigeria.";

export const metadata: Metadata = {
  title: siteName,
  description,
  alternates: {
    canonical: canonicalUrl("/"),
  },
  openGraph: {
    title: siteName,
    description,
    url: canonicalUrl("/"),
    type: "website",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description,
    images: ["/opengraph-image"],
  },
};

export default async function HomePage() {
  const customOrdersList = await db
    .select()
    .from(customOrders)
    .where(eq(customOrders.isPublished, true))
    .orderBy(asc(customOrders.position), desc(customOrders.updatedAt))
    .limit(3);

  return (
    <>
      <ThreeItemGrid />
      <Carousel />
      
      {/* Trust Badges Section */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <TrustBadges variant="grid" />
      </div>

      <CollectionSections />
      
      {/* Testimonials Section */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="mb-8 text-center text-3xl font-bold text-black dark:text-white">
          What Our Customers Say
        </h2>
        <TestimonialsCarousel />
      </div>

      <CustomShowcase
        orders={customOrdersList.map((order) => ({
          id: order.id,
          title: order.title,
          beforeImage: order.beforeImage,
          afterImage: order.afterImage,
        }))}
      />
      <Footer />
    </>
  );
}
