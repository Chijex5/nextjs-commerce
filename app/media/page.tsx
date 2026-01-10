import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Media & Gallery",
  description:
    "Browse photos and media from public events, official visits, and community engagements.",
  openGraph: {
    type: "website",
  },
};

export default function MediaPage() {
  const galleries = [
    {
      title: "Community Events 2024",
      count: 12,
      coverImage: "[Placeholder]",
    },
    {
      title: "Official Visits",
      count: 8,
      coverImage: "[Placeholder]",
    },
    {
      title: "Public Speeches",
      count: 15,
      coverImage: "[Placeholder]",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-4xl font-bold md:text-5xl">Media & Gallery</h1>
      <p className="mb-12 text-lg text-neutral-700 dark:text-neutral-300">
        Browse photos and media from public events, official visits, and
        community engagements.
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {galleries.map((gallery, index) => (
          <div
            key={index}
            className="group cursor-pointer overflow-hidden rounded-lg border border-neutral-200 bg-white transition-shadow hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="aspect-video bg-neutral-200 dark:bg-neutral-800">
              <div className="flex h-full items-center justify-center text-neutral-400">
                <svg
                  className="h-16 w-16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
            <div className="p-4">
              <h3 className="mb-2 text-lg font-bold group-hover:text-neutral-700 dark:group-hover:text-neutral-300">
                {gallery.title}
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {gallery.count} photos
              </p>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-16">
        <h2 className="mb-6 text-3xl font-semibold">Video Archive</h2>
        <p className="mb-6 text-neutral-700 dark:text-neutral-300">
          Access recordings of public speeches, town halls, and important
          announcements.
        </p>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-neutral-600 dark:text-neutral-400">
            Video content will be added soon. Please check back later.
          </p>
        </div>
      </section>
    </div>
  );
}
