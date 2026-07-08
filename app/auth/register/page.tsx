import { Suspense } from "react";
import Register from "./Register";

function RegisterSkeleton() {
  return (
    <div className="rc-card-skeleton">
      <style>{`
        .rc-card-skeleton {
          width: 100%; box-sizing: border-box;
          background: var(--dp-card);
          border: 1px solid var(--dp-border);
          border-radius: 14px;
          padding: 1.75rem 1.5rem;
        }
        @media (min-width: 960px) { .rc-card-skeleton { border-radius: 4px; } }
        .rc-sk { border-radius: 8px; background: var(--dp-border); animation: rc-pulse 1.4s ease-in-out infinite; }
        @keyframes rc-pulse { 0%,100% { opacity: .4; } 50% { opacity: .8; } }
      `}</style>
      <div
        className="rc-sk"
        style={{ height: 24, width: "60%", marginBottom: 24 }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="rc-sk" style={{ height: 52 }} />
        <div className="rc-sk" style={{ height: 52 }} />
        <div className="rc-sk" style={{ height: 52 }} />
        <div className="rc-sk" style={{ height: 54, marginTop: 8 }} />
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterSkeleton />}>
      <Register />
    </Suspense>
  );
}
