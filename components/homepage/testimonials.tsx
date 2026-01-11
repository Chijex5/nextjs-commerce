export function Testimonials() {
  const testimonials = [
    {
      content:
        "The quality is exceptional! These are the most comfortable slippers I've ever owned. Worth every penny.",
      author: "Chioma A.",
    },
    {
      content:
        "I ordered a custom design and they brought my vision to life perfectly. The attention to detail is incredible.",
      author: "Tunde B.",
    },
    {
      content:
        "Beautiful craftsmanship and excellent customer service. My go-to for handmade footwear.",
      author: "Amara O.",
    },
  ];

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Loved by Customers
          </h2>
          <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
            See what our customers have to say about their experience
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900"
            >
              <p className="text-sm italic text-neutral-600 dark:text-neutral-400">
                "{testimonial.content}"
              </p>
              <p className="mt-4 text-sm font-semibold">{testimonial.author}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
