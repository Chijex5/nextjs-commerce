import Grid from "components/grid";

export default function Loading() {
  return (
    <>
      {/* Matches the search page header height roughly */}
      <div style={{ marginBottom: "3rem" }}>
        {/* Label shimmer */}
        <div
          style={{
            height: ".5rem",
            width: "6rem",
            background: "rgba(242,232,213,0.06)",
            marginBottom: "1.25rem",
            animation: "dp-pulse 1.8s ease-in-out infinite",
          }}
        />
        {/* Title shimmer */}
        <div
          style={{
            height: "4rem",
            width: "clamp(12rem,35vw,22rem)",
            background: "rgba(242,232,213,0.06)",
            marginBottom: "1rem",
            animation: "dp-pulse 1.8s ease-in-out infinite",
          }}
        />
        {/* Sub-text shimmer */}
        <div
          style={{
            height: ".5rem",
            width: "8rem",
            background: "rgba(242,232,213,0.04)",
            marginBottom: "2rem",
            animation: "dp-pulse 1.8s ease-in-out infinite",
          }}
        />
        {/* Search bar shimmer */}
        <div
          style={{
            height: "3rem",
            background: "rgba(242,232,213,0.05)",
            border: "1px solid rgba(242,232,213,0.07)",
            animation: "dp-pulse 1.8s ease-in-out infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes dp-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .4; }
        }
      `}</style>

      <Grid className="grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style={{ gap: ".75rem" }}>
        {Array(12)
          .fill(0)
          .map((_, index) => (
            <Grid.Item
              key={index}
              style={{
                aspectRatio: "3/4",
                background: "var(--dp-card)",
                border: "1px solid var(--dp-border)",
                animation: `dp-pulse ${1.6 + (index % 4) * 0.1}s ease-in-out infinite`,
              }}
            />
          ))}
      </Grid>
    </>
  );
}