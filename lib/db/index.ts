import prisma from "../prisma";

// Export the Prisma client instance for use in other parts of the application
export const db = prisma;

// Export Prisma types
export type {
  Product,
  ProductVariant,
  ProductOption,
  ProductImage,
  Collection,
  ProductCollection,
  Cart,
  CartLine,
  Page,
  Menu,
  MenuItem,
} from "prisma/generated/prisma/client";

