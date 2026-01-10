import Footer from "components/layout/footer";
import Link from "next/link";

export const metadata = {
  description:
    "Official portfolio website of [Politician Name] - Public office holder dedicated to serving the community.",
  openGraph: {
    type: "website",
  },
};

export default function HomePage() {
  const quickLinks = [
    {
      title: "About",
      description: "Learn about the background, education, and career journey",
      href: "/about",
    },
    {
      title: "Achievements",
      description: "Explore key accomplishments and ongoing initiatives",
      href: "/achievements",
    },
    {
      title: "News",
      description: "Stay updated with the latest announcements and press releases",
      href: "/news",
    },
    {
      title: "Media",
      description: "Browse photos and videos from public events",
      href: "/media",
    },
    {
      title: "Contact",
      description: "Get in touch with our office for assistance",
      href: "/contact",
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
        <div className="text-center">
          <h1 className="mb-6 text-4xl font-bold md:text-6xl">
            [Politician Name]
          </h1>
          <p className="mb-4 text-xl text-neutral-700 dark:text-neutral-300 md:text-2xl">
            [Current Position/Title]
          </p>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
            Dedicated to serving the community with integrity, transparency, and a commitment to positive change.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/about"
              className="rounded-lg bg-neutral-900 px-6 py-3 font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Learn More
            </Link>
            <Link
              href="/contact"
              className="rounded-lg border border-neutral-300 bg-white px-6 py-3 font-medium transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>

      {/* Key Highlights Section */}
      <section className="bg-neutral-100 py-16 dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
            Key Areas of Focus
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-neutral-800">
              <h3 className="mb-3 text-xl font-bold">Community Development</h3>
              <p className="text-neutral-700 dark:text-neutral-300">
                Working to improve infrastructure, services, and quality of life for all constituents.
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-neutral-800">
              <h3 className="mb-3 text-xl font-bold">Education & Youth</h3>
              <p className="text-neutral-700 dark:text-neutral-300">
                Championing educational initiatives and opportunities for young people.
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-neutral-800">
              <h3 className="mb-3 text-xl font-bold">Economic Growth</h3>
              <p className="text-neutral-700 dark:text-neutral-300">
                Supporting local businesses and creating sustainable economic opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
          Explore
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-lg border border-neutral-200 bg-white p-6 transition-shadow hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
            >
              <h3 className="mb-2 text-xl font-bold group-hover:text-neutral-700 dark:group-hover:text-neutral-300">
                {link.title} →
              </h3>
              <p className="text-neutral-700 dark:text-neutral-300">
                {link.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}
