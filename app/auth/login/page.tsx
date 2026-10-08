import { Suspense } from "react";
import Login from "./Login";

function LoginSkeleton() {
  return (
    <div aria-busy className="space-y-6">
      <div className="h-3 w-24 animate-pulse bg-plate" />
      <div className="h-16 w-3/4 animate-pulse bg-plate" />
      <div className="h-12 animate-pulse bg-plate" />
      <div className="h-14 animate-pulse bg-plate" />
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
