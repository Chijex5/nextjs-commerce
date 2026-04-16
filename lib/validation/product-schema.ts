import { z } from "zod";

/* ─── Base Schemas ──────────────────────────────────────────────────────── */

export const ProductImageSchema = z.object({
  url: z.string().url("Invalid image URL"),
  altText: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  position: z.number().int().nonnegative().optional(),
  isFeatured: z.boolean().optional(),
});

export const ProductVariantSchema = z.object({
  title: z.string().trim().min(1, "Variant title required").max(255),
  price: z
    .union([z.string(), z.number()])
    .pipe(
      z.coerce
        .number()
        .nonnegative("Price cannot be negative")
        .max(999999999, "Price too high"),
    ),
  currencyCode: z.string().default("NGN"),
  availableForSale: z.boolean().default(true),
  selectedOptions: z
    .array(
      z.object({
        name: z.string(),
        value: z.string(),
      }),
    )
    .default([]),
});

export const SelectedOptionsSchema = z.array(
  z.object({
    name: z.string(),
    value: z.string(),
  }),
);

export const SizePriceRuleSchema = z.object({
  from: z
    .union([z.string(), z.number()])
    .pipe(z.coerce.number().int().positive("Size must be positive")),
  price: z
    .union([z.string(), z.number()])
    .pipe(
      z.coerce
        .number()
        .nonnegative("Price cannot be negative")
        .max(999999999),
    ),
});

export const ColorPriceSchema = z.record(
  z.string(),
  z
    .union([z.string(), z.number()])
    .pipe(
      z.coerce
        .number()
        .nonnegative("Price cannot be negative")
        .max(999999999),
    ),
);

/* ─── Product Creation/Update Schema ──────────────────────────────────── */

export const CreateProductSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  handle: z
    .string()
    .trim()
    .min(1, "Handle is required")
    .max(255)
    .regex(
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
      "Handle must be lowercase alphanumeric with hyphens only",
    ),
  description: z.string().trim().max(5000).optional().default(""),
  descriptionHtml: z.string().max(10000).optional().default(""),
  availableForSale: z.boolean().default(true),
  seoTitle: z.string().trim().max(255).optional(),
  seoDescription: z.string().trim().max(160).optional(),
  tags: z.array(z.string().trim()).default([]),
  images: z.array(ProductImageSchema).max(20, "Maximum 20 images allowed"),
  sizes: z.array(z.string().trim()).max(50, "Maximum 50 sizes").optional(),
  colors: z.array(z.string().trim()).max(50, "Maximum 50 colors").optional(),
  basePrice: z
    .union([z.string(), z.number()])
    .pipe(
      z.coerce
        .number()
        .nonnegative("Price cannot be negative")
        .max(999999999),
    ),
  largeSizePrice: z
    .union([z.string(), z.number(), z.null()])
    .pipe(
      z.coerce
        .number()
        .nonnegative("Price cannot be negative")
        .max(999999999)
        .nullable(),
    )
    .optional()
    .nullable(),
  largeSizeFrom: z
    .union([z.string(), z.number(), z.null()])
    .pipe(z.coerce.number().positive().nullable())
    .optional()
    .nullable(),
  sizePriceRules: z.array(SizePriceRuleSchema).optional().default([]),
  colorPrices: ColorPriceSchema.optional(),
  collectionIds: z
    .array(z.string().uuid("Invalid collection ID"))
    .optional()
    .default([]),
});

/* ─── CSV Import Schema ──────────────────────────────────────────────── */

export const CSVProductRowSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  price: z
    .union([z.string(), z.number()])
    .pipe(
      z.coerce
        .number()
        .positive("Price must be greater than 0"),
    ),
  available_for_sale: z.string().optional().default("true"),
  tags: z.string().optional(),
  image_url: z.string().url("Invalid image URL").optional(),
  variant_title: z.string().optional(),
  variant_size: z.string().optional(),
  variant_color: z.string().optional(),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type CSVProductRow = z.infer<typeof CSVProductRowSchema>;
