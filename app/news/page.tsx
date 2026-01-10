import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "News & Updates",
  description:
    "Stay informed with the latest news, announcements, and updates from our office.",
  openGraph: {
    type: "website",
  },
};

export default function NewsPage() {
  const newsItems = [
    {
      date: "January 10, 2026",
      title: "[News Headline]",
      excerpt: "[Brief summary of the news item or announcement]",
      category: "Press Release",
    },
    {
      date: "December 15, 2025",
      title: "[News Headline]",
      excerpt: "[Brief summary of the news item or announcement]",
      category: "Event",
    },
    {
      date: "November 22, 2025",
      title: "[News Headline]",
      excerpt: "[Brief summary of the news item or announcement]",
      category: "Announcement",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-4xl font-bold md:text-5xl">News & Updates</h1>
      <p className="mb-12 text-lg text-neutral-700 dark:text-neutral-300">
        Stay informed with the latest news, press releases, and announcements
        from our office.
      </p>

      <div className="space-y-8">
        {newsItems.map((item, index) => (
          <article
            key={index}
            className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                {item.date}
              </span>
              <span className="inline-block rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                {item.category}
              </span>
            </div>
            <h2 className="mb-3 text-2xl font-bold">{item.title}</h2>
            <p className="text-neutral-700 dark:text-neutral-300">
              {item.excerpt}
            </p>
            <button className="mt-4 font-medium text-neutral-900 underline-offset-4 hover:underline dark:text-neutral-100">
              Read more →
            </button>
          </article>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-neutral-600 dark:text-neutral-400">
          For media inquiries, please visit our{" "}
          <a href="/contact" className="font-medium underline">
            contact page
          </a>
          .
        </p>
      </div>
    </div>
  );
}
