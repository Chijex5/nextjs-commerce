/** Validates an edit-menu item from the admin form. */
export function readEditOption(input: Record<string, unknown>) {
  const name = typeof input.name === "string" ? input.name.trim().slice(0, 120) : "";
  if (!name) return { error: "Give the edit a name" } as const;
  const price = Number(input.price);
  if (!Number.isFinite(price) || price < 0 || price > 10_000_000)
    return { error: "Enter a price in naira (0 for free)" } as const;
  const str = (v: unknown, max: number) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
  const image = str(input.image, 500);
  if (image && !/^https:\/\//.test(image)) return { error: "Image must be an https link" } as const;
  return {
    value: {
      name,
      price: String(Math.round(price)),
      description: str(input.description, 300),
      detailPrompt: str(input.detailPrompt, 120),
      image,
      needsReview: input.needsReview === true,
      isActive: input.isActive !== false,
      position: Number.isFinite(Number(input.position)) ? Math.round(Number(input.position)) : 0,
    },
  } as const;
}
