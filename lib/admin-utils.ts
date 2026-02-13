/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Generate SEO title from product title
 */
export function generateSeoTitle(
  title: string,
  brandName: string = "D'FOOTPRINT",
): string {
  return `${title} - ${brandName}`;
}

/**
 * Generate SEO description from product description
 */
export function generateSeoDescription(
  description: string,
  maxLength: number = 160,
): string {
  if (!description) return "";

  // Strip HTML tags if present
  const plainText = description.replace(/<[^>]*>/g, "");

  // Truncate to maxLength
  if (plainText.length <= maxLength) {
    return plainText;
  }

  // Truncate and add ellipsis
  return plainText.substring(0, maxLength - 3).trim() + "...";
}

/**
 * Format price for display
 */
export function formatPrice(
  price: number | string,
  currency: string = "NGN",
): string {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  return `${currency} ${numPrice.toLocaleString("en-NG")}`;
}

/**
 * Parse CSV content to array of objects
 */
export function parseCSV(csvContent: string): Record<string, string>[] {
  const lines = csvContent.trim().split("\n");
  if (lines.length < 2) {
    throw new Error(
      "CSV file must have at least a header row and one data row",
    );
  }

  const headers = lines[0]?.split(",").map((h) => h.trim()) || [];
  const data: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const values = line.split(",");
    if (values.length !== headers.length) {
      continue; // Skip malformed rows
    }

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      const value = values[index];
      row[header] = value?.trim() || "";
    });
    data.push(row);
  }

  return data;
}

/**
 * Validate required product fields
 */
export function validateProductData(data: {
  title?: string;
  handle?: string;
  price?: number | string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.title || data.title.trim() === "") {
    errors.push("Title is required");
  }

  if (!data.handle || data.handle.trim() === "") {
    errors.push("Handle is required");
  }

  if (!data.price || Number(data.price) <= 0) {
    errors.push("Valid price is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate bulk import CSV template
 */
export function generateBulkImportTemplate(): string {
  const headers = [
    "title",
    "description",
    "price",
    "available_for_sale",
    "tags",
    "image_url",
    "variant_title",
    "variant_size",
    "variant_color",
  ];

  const sampleRow = [
    "Sample Product",
    "This is a sample product description",
    "12000",
    "true",
    "featured,bestseller",
    "https://example.com/image.jpg",
    "Size 40 / Black",
    "40",
    "Black",
  ];

  return `${headers.join(",")}\n${sampleRow.join(",")}\n`;
}

/**
 * Calculate variant price based on size, color, and pricing rules
 */
export function getVariantPrice(
  size: string,
  color: string,
  pricingConfig: {
    basePrice?: number;
    colorPrices?: Record<string, number>;
    largeSizePrice?: number | null;
    largeSizeFrom?: number | null;
    sizePriceRules?: Array<{ from: string | number; price: string | number }>;
  },
): number {
  const basePrice = pricingConfig.basePrice || 0;
  const colorPrices = pricingConfig.colorPrices || {};
  const largeSizePrice = pricingConfig.largeSizePrice;
  const largeSizeFrom = pricingConfig.largeSizeFrom;
  const sizePriceRules = Array.isArray(pricingConfig.sizePriceRules)
    ? pricingConfig.sizePriceRules
        .map((rule: any) => ({
          from: parseInt(String(rule.from), 10),
          price: parseFloat(String(rule.price)),
        }))
        .filter(
          (rule: any) =>
            !Number.isNaN(rule.from) &&
            !Number.isNaN(rule.price) &&
            rule.from > 0,
        )
        .sort((a: any, b: any) => b.from - a.from)
    : [];

  const colorKey = color.trim().toLowerCase();
  if (colorPrices[colorKey] !== undefined) {
    return colorPrices[colorKey];
  }

  if (sizePriceRules.length > 0) {
    const sizeValue = parseInt(size, 10);
    if (!Number.isNaN(sizeValue)) {
      const matched = sizePriceRules.find(
        (rule: any) => sizeValue >= rule.from,
      );
      if (matched) return matched.price;
    }
  }

  if (
    largeSizeFrom !== null &&
    largeSizeFrom !== undefined &&
    largeSizePrice !== null &&
    largeSizePrice !== undefined &&
    parseInt(size, 10) >= largeSizeFrom
  ) {
    return largeSizePrice;
  }

  return basePrice;
}
