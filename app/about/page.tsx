import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about our public office holder's background, education, and career journey.",
  openGraph: {
    type: "article",
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-4xl font-bold md:text-5xl">About</h1>

      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold">Biography</h2>
        <div className="prose prose-lg dark:prose-invert">
          <p className="mb-4 text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
            [Placeholder for politician's biography]
          </p>
          <p className="mb-4 leading-relaxed text-neutral-700 dark:text-neutral-300">
            This section will contain a comprehensive biography of the public
            office holder, including their background, early life, education,
            and path to public service.
          </p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold">Education</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-neutral-300 pl-4 dark:border-neutral-700">
            <p className="text-neutral-600 dark:text-neutral-400">[Year]</p>
            <h3 className="font-semibold">[Degree]</h3>
            <p className="text-neutral-700 dark:text-neutral-300">
              [Institution]
            </p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold">Career Highlights</h2>
        <div className="space-y-6">
          <div className="border-l-4 border-neutral-300 pl-4 dark:border-neutral-700">
            <p className="text-neutral-600 dark:text-neutral-400">
              [Year - Present]
            </p>
            <h3 className="font-semibold text-lg">[Current Position]</h3>
            <p className="mt-2 text-neutral-700 dark:text-neutral-300">
              [Description of current role and responsibilities]
            </p>
          </div>
          <div className="border-l-4 border-neutral-300 pl-4 dark:border-neutral-700">
            <p className="text-neutral-600 dark:text-neutral-400">
              [Year - Year]
            </p>
            <h3 className="font-semibold text-lg">[Previous Position]</h3>
            <p className="mt-2 text-neutral-700 dark:text-neutral-300">
              [Description of previous role and accomplishments]
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Values & Vision</h2>
        <div className="prose prose-lg dark:prose-invert">
          <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
            [Placeholder for the politician's core values and vision for public
            service]
          </p>
        </div>
      </section>
    </div>
  );
}
