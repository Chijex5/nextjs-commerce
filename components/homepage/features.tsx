export function Features() {
  const features = [
    {
      name: "100% Handmade",
      description:
        "Every pair is carefully crafted by skilled artisans using traditional techniques and modern design.",
    },
    {
      name: "Premium Materials",
      description:
        "We use only the finest leather, suede, velvet, and other high-quality materials for lasting comfort.",
    },
    {
      name: "Custom Designs",
      description:
        "Bring your vision to life with our custom order service. Submit your design or request modifications.",
    },
    {
      name: "Nationwide Delivery",
      description:
        "We deliver to every location across Nigeria, bringing quality footwear right to your doorstep.",
    },
  ];

  return (
    <section className="border-y border-neutral-200 bg-neutral-50 py-16 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Why Choose D'FOOTPRINT
          </h2>
          <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
            Quality craftsmanship meets exceptional service
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.name} className="text-center">
              <h3 className="text-lg font-semibold">{feature.name}</h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
