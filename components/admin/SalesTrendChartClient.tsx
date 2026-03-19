"use client";

import dynamic from "next/dynamic";
import type { FC } from "react";

type SalesTrendPoint = {
  time: string;
  label: string;
  tooltip: string;
  revenue: number;
  orders: number;
};

type SalesTrendChartClientProps = {
  data: SalesTrendPoint[];
  currencyCode?: string;
};

const SalesTrendChart = dynamic(
  // @ts-ignore
  () => import("./SalesTrendChart") as Promise<FC<SalesTrendChartClientProps>>,
  { ssr: false }
);


export default function SalesTrendChartClient(
  props: SalesTrendChartClientProps,
) {
  return <SalesTrendChart {...props} />;
}
