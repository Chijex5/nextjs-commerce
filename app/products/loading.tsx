export default function Loading() {
  return (
    <section
      aria-busy
      className="bg-canvas px-4 pb-28 pt-10 sm:px-8 sm:pt-14 md:px-12"
    >
      <div className="h-3 w-32 animate-pulse bg-plate" />
      <div className="mt-6 h-[clamp(3rem,12vw,9rem)] w-2/3 animate-pulse bg-plate" />
      <div className="mt-10 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-20 animate-pulse bg-plate" />
        ))}
      </div>
      <ul className="mt-12 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i}>
            <div className="aspect-[4/5] animate-pulse bg-plate" />
            <div className="mt-3 h-3 w-2/3 animate-pulse bg-plate" />
          </li>
        ))}
      </ul>
    </section>
  );
}
