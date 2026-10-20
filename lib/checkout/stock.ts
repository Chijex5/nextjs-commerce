/** Stock checks for a priced bag (pure: unit-tested without a database). */

export type StockLine = {
  lineId: string;
  quantity: number;
  /** The pairs the line takes: one, or His + Hers for a couples set. */
  parts: Array<{ id: string; left: number }>;
};

/**
 * Lines the stock can't cover, with how many of that line could still be
 * had. A stocked pair can be in the bag on its own and inside a set, so
 * demand is the whole bag's, not each line's alone.
 */
export function stockShortfalls(lines: StockLine[]) {
  const demand = new Map<string, number>();
  for (const line of lines) {
    for (const part of line.parts) {
      demand.set(part.id, (demand.get(part.id) ?? 0) + line.quantity);
    }
  }
  const short = new Map<string, number>();
  for (const line of lines) {
    let available = Infinity;
    for (const part of line.parts) {
      const wanted = demand.get(part.id) ?? 0;
      if (part.left >= wanted) continue;
      const others = wanted - line.quantity;
      available = Math.min(available, Math.max(0, part.left - others));
    }
    if (available !== Infinity) short.set(line.lineId, available);
  }
  return short;
}
