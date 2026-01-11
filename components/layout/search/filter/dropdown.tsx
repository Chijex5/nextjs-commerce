"use client";

import type { ListItem } from ".";
import { FilterChip } from "./item";

export default function FilterItemDropdown({ list }: { list: ListItem[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {list.map((item: ListItem, i) => (
        <FilterChip key={i} item={item} />
      ))}
    </div>
  );
}
