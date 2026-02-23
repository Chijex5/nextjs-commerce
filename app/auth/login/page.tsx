import { Suspense } from "react";
import Login from "./Login";

function LoginSkeleton() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950 md:p-8">
      <div className="h-6 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="mt-6 space-y-3">
        <div className="h-11 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-11 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-11 animate-pulse rounded-full bg-neutral-300 dark:bg-neutral-700" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <Login />
    </Suspense>
  );
}
