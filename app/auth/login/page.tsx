import { Suspense } from "react";
import Login from "./Login";

function LoginSkeleton() {
  return (
    <div className="mx-auto mt-20 max-w-md px-4">
      <div className="rounded-lg border p-8">
        <div className="h-6 w-32 animate-pulse rounded bg-neutral-200" />
        <div className="mt-6 space-y-4">
          <div className="h-10 animate-pulse rounded bg-neutral-200" />
          <div className="h-10 animate-pulse rounded bg-neutral-200" />
          <div className="h-10 animate-pulse rounded bg-neutral-300" />
        </div>
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