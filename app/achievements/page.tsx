import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Achievements & Initiatives",
  description: "Explore the key achievements, initiatives, and legislative accomplishments.",
  openGraph: {
    type: "article",
  },
};

export default function AchievementsPage() {
  const achievements = [
    {
      year: "2024",
      title: "[Achievement Title]",
      category: "Legislative",
      description: "[Description of the achievement and its impact on the community]",
    },
    {
      year: "2023",
      title: "[Achievement Title]",
      category: "Community",
      description: "[Description of the achievement and its impact on the community]",
    },
    {
      year: "2023",
      title: "[Achievement Title]",
      category: "Infrastructure",
      description: "[Description of the achievement and its impact on the community]",
    },
  ];

  const initiatives = [
    {
      title: "[Initiative Name]",
      status: "Ongoing",
      description: "[Description of the initiative and its goals]",
    },
    {
      title: "[Initiative Name]",
      status: "Completed",
      description: "[Description of the initiative and its outcomes]",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-4xl font-bold md:text-5xl">Achievements & Initiatives</h1>
      
      <section className="mb-16">
        <h2 className="mb-6 text-3xl font-semibold">Key Achievements</h2>
        <div className="space-y-6">
          {achievements.map((achievement, index) => (
            <div
              key={index}
              className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <span className="inline-block rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                    {achievement.category}
                  </span>
                </div>
                <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                  {achievement.year}
                </span>
              </div>
              <h3 className="mb-2 text-xl font-bold">{achievement.title}</h3>
              <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
                {achievement.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-3xl font-semibold">Current Initiatives</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {initiatives.map((initiative, index) => (
            <div
              key={index}
              className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xl font-bold">{initiative.title}</h3>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    initiative.status === "Ongoing"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  }`}
                >
                  {initiative.status}
                </span>
              </div>
              <p className="text-neutral-700 dark:text-neutral-300">
                {initiative.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
