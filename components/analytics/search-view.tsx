"use client";

import { trackSearchResults } from "lib/analytics";
import { useEffect } from "react";

type Props = {
  query?: string;
  resultCount: number;
  sort?: string;
  page: number;
  availableOnly: boolean;
  tag?: string;
  minPrice?: number;
  maxPrice?: number;
};

export default function SearchViewAnalytics({
  query,
  resultCount,
  sort,
  page,
  availableOnly,
  tag,
  minPrice,
  maxPrice,
}: Props) {
  useEffect(() => {
    trackSearchResults({
      query,
      resultCount,
      sort,
      page,
      availableOnly,
      tag,
      minPrice,
      maxPrice,
    });
  }, [query, resultCount, sort, page, availableOnly, tag, minPrice, maxPrice]);

  return null;
}
