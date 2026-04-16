"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface ProductsPerPageSelectProps {
  perPage: number;
}

export default function ProductsPerPageSelect({
  perPage,
}: ProductsPerPageSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <select
      defaultValue={perPage}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", "1");
        params.set("perPage", e.target.value);
        router.push(`/admin/products?${params.toString()}`);
      }}
      className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs font-medium text-neutral-700 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
    >
      <option value="20">20 / page</option>
      <option value="40">40 / page</option>
      <option value="60">60 / page</option>
      <option value="100">100 / page</option>
    </select>
  );
}
