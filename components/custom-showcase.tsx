import Link from "next/link";
import Image from "next/image";

interface CustomOrder {
  id: number;
  customerRequest: string;
  beforeImage: string;
  afterImage: string;
  title: string;
}

// Sample data - in production this would come from a database
const showcaseOrders: CustomOrder[] = [
  {
    id: 1,
    title: "Custom Velvet Slides",
    customerRequest: "Customer's inspiration photo",
    beforeImage:
      "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=400&h=400&fit=crop",
    afterImage:
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&h=400&fit=crop",
  },
  {
    id: 2,
    title: "Embellished Slippers",
    customerRequest: "Customer's design request",
    beforeImage:
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400&h=400&fit=crop",
    afterImage:
      "https://images.unsplash.com/photo-1582897085656-c84d8f5cd7fc?w=400&h=400&fit=crop",
  },
  {
    id: 3,
    title: "Leather Sandals",
    customerRequest: "Reference image shared",
    beforeImage:
      "https://images.unsplash.com/photo-1631545805976-146c7bdacbe7?w=400&h=400&fit=crop",
    afterImage:
      "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=400&h=400&fit=crop",
  },
];

export function CustomShowcase() {
  return (
    <section className="border-t border-neutral-200 bg-white py-12 dark:border-neutral-700 dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Custom Orders We've Created
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            From inspiration to reality - see how we bring your ideas to life
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {showcaseOrders.map((order) => (
            <Link
              key={order.id}
              href={`/custom-orders#order-${order.id}`}
              className="group block overflow-hidden rounded-lg border border-neutral-200 bg-white transition-shadow hover:shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
            >
              <div className="grid grid-cols-2 gap-2 p-4">
                <div className="space-y-2">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {order.customerRequest}
                  </p>
                  <div className="relative aspect-square overflow-hidden rounded-md">
                    <Image
                      src={order.beforeImage}
                      alt="Customer request"
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 200px, (min-width: 640px) 300px, 150px"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold">Our Creation</p>
                  <div className="relative aspect-square overflow-hidden rounded-md">
                    <Image
                      src={order.afterImage}
                      alt="Final product"
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 200px, (min-width: 640px) 300px, 150px"
                    />
                  </div>
                </div>
              </div>
              <div className="border-t border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800">
                <p className="text-sm font-medium">{order.title}</p>
                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  View details →
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/custom-orders"
            className="inline-flex items-center text-sm font-semibold hover:underline"
          >
            View All Custom Orders →
          </Link>
        </div>
      </div>
    </section>
  );
}
