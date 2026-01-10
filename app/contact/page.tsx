import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with our office for inquiries, assistance, or more information.",
  openGraph: {
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-4xl font-bold md:text-5xl">Contact Us</h1>
      <p className="mb-12 text-lg text-neutral-700 dark:text-neutral-300">
        Get in touch with our office for inquiries, assistance, or more
        information.
      </p>

      <div className="grid gap-8 md:grid-cols-2">
        <section className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-4 text-2xl font-semibold">Office Information</h2>
          <div className="space-y-4">
            <div>
              <h3 className="mb-1 font-semibold">Address</h3>
              <p className="text-neutral-700 dark:text-neutral-300">
                [Office Address]
                <br />
                [City, State ZIP]
              </p>
            </div>
            <div>
              <h3 className="mb-1 font-semibold">Phone</h3>
              <p className="text-neutral-700 dark:text-neutral-300">
                <a href="tel:[phone-number]" className="hover:underline">
                  [Phone Number]
                </a>
              </p>
            </div>
            <div>
              <h3 className="mb-1 font-semibold">Email</h3>
              <p className="text-neutral-700 dark:text-neutral-300">
                <a href="mailto:[email]" className="hover:underline">
                  [Email Address]
                </a>
              </p>
            </div>
            <div>
              <h3 className="mb-1 font-semibold">Office Hours</h3>
              <p className="text-neutral-700 dark:text-neutral-300">
                Monday - Friday: [Hours]
                <br />
                Saturday - Sunday: Closed
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-4 text-2xl font-semibold">Get in Touch</h2>
          <p className="mb-4 text-neutral-700 dark:text-neutral-300">
            For general inquiries, please use the contact information provided.
            For media inquiries, please email our press office.
          </p>
          <div className="space-y-3">
            <div>
              <h3 className="mb-1 font-semibold">Press Inquiries</h3>
              <p className="text-neutral-700 dark:text-neutral-300">
                <a href="mailto:[press-email]" className="hover:underline">
                  [Press Email]
                </a>
              </p>
            </div>
            <div>
              <h3 className="mb-1 font-semibold">Constituent Services</h3>
              <p className="text-neutral-700 dark:text-neutral-300">
                <a href="mailto:[services-email]" className="hover:underline">
                  [Services Email]
                </a>
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-12 rounded-lg border border-neutral-200 bg-neutral-50 p-8 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-4 text-2xl font-semibold">Follow Us</h2>
        <p className="mb-4 text-neutral-700 dark:text-neutral-300">
          Stay connected and informed through our social media channels.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="#"
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 font-medium transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
          >
            Twitter
          </a>
          <a
            href="#"
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 font-medium transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
          >
            Facebook
          </a>
          <a
            href="#"
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 font-medium transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
          >
            Instagram
          </a>
        </div>
      </section>
    </div>
  );
}
