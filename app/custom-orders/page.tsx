import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Custom Orders Gallery - D'FOOTPRINT",
  description:
    "See how we transform customer ideas into beautiful handmade footwear. Browse our gallery of custom orders and get inspired for your own design.",
  openGraph: {
    title: "Custom Orders Gallery - D'FOOTPRINT",
    description:
      "See how we transform customer ideas into beautiful handmade footwear.",
    type: "website",
  },
};

interface CustomOrderDetail {
  id: number;
  title: string;
  customerStory: string;
  beforeImage: string;
  afterImage: string;
  details: string[];
  completionTime: string;
}

// Sample data - in production this would come from a database
const customOrders: CustomOrderDetail[] = [
  {
    id: 1,
    title: "Custom Velvet Slides with Gold Accents",
    customerStory:
      "Customer shared an inspiration photo of designer slides they loved but wanted in different colors and with custom embellishments.",
    beforeImage:
      "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=600&h=600&fit=crop",
    afterImage:
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&h=600&fit=crop",
    details: [
      "Premium burgundy velvet material",
      "Custom gold metal accents",
      "Cushioned insole for comfort",
      "Non-slip rubber sole",
    ],
    completionTime: "7 days",
  },
  {
    id: 2,
    title: "Embellished Wedding Slippers",
    customerStory:
      "Bride wanted special slippers for her wedding day that matched her dress. She provided fabric swatches and design ideas.",
    beforeImage:
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&h=600&fit=crop",
    afterImage:
      "https://images.unsplash.com/photo-1582897085656-c84d8f5cd7fc?w=600&h=600&fit=crop",
    details: [
      "Ivory satin with lace overlay",
      "Pearl and crystal embellishments",
      "Custom fit for all-day comfort",
      "Matching storage bag included",
    ],
    completionTime: "10 days",
  },
  {
    id: 3,
    title: "Minimalist Leather Sandals",
    customerStory:
      "Customer requested a clean, modern design inspired by Scandinavian footwear but adapted for Nigerian weather.",
    beforeImage:
      "https://images.unsplash.com/photo-1631545805976-146c7bdacbe7?w=600&h=600&fit=crop",
    afterImage:
      "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=600&h=600&fit=crop",
    details: [
      "Full-grain vegetable-tanned leather",
      "Minimalist strap design",
      "Anatomical footbed",
      "Durable construction",
    ],
    completionTime: "5 days",
  },
  {
    id: 4,
    title: "Colorful Beaded Slides",
    customerStory:
      "Customer wanted slides that reflected traditional African patterns and colors while maintaining a contemporary look.",
    beforeImage:
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&h=600&fit=crop",
    afterImage:
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&h=600&fit=crop",
    details: [
      "Hand-beaded geometric pattern",
      "Vibrant multi-color design",
      "Soft leather base",
      "Comfortable fit",
    ],
    completionTime: "14 days",
  },
];

export default function CustomOrdersPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
          Custom Orders Gallery
        </h1>
        <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
          Every pair tells a story. See how we bring our customers' visions to
          life.
        </p>
      </div>

      {/* Custom Orders Grid */}
      <div className="space-y-16">
        {customOrders.map((order) => (
          <article
            key={order.id}
            id={`order-${order.id}`}
            className="scroll-mt-24 rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
          >
            <div className="grid gap-8 p-6 lg:grid-cols-2 lg:p-8">
              {/* Images Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold lg:text-2xl">{order.title}</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      Customer's Request
                    </p>
                    <div className="relative aspect-square overflow-hidden rounded-lg">
                      <Image
                        src={order.beforeImage}
                        alt="Customer request"
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 300px, (min-width: 640px) 250px, 150px"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      Final Product
                    </p>
                    <div className="relative aspect-square overflow-hidden rounded-lg">
                      <Image
                        src={order.afterImage}
                        alt="Final product"
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 300px, (min-width: 640px) 250px, 150px"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Details Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-sm font-semibold">The Story</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {order.customerStory}
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold">Details</h3>
                  <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                    {order.details.map((detail, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-md bg-neutral-50 p-3 dark:bg-neutral-800">
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    <span className="font-semibold">Completion Time:</span>{" "}
                    {order.completionTime}
                  </p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* CTA Section */}
      <div className="mt-16 rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center dark:border-neutral-700 dark:bg-neutral-900">
        <h2 className="text-2xl font-bold">Ready to Create Your Own?</h2>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Share your design ideas with us and we'll bring them to life.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="/contact"
            className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            Contact Us
          </a>
          <a
            href="/products"
            className="text-sm font-semibold hover:underline"
          >
            Browse Ready-Made Designs
          </a>
        </div>
      </div>
    </div>
  );
}
