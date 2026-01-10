import { PrismaClient } from "prisma/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";


const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}
const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_URL;
console.log("Database URL:", databaseUrl);
if (!databaseUrl) {
  throw new Error(
    "No database URL found. Please set PRISMA_DATABASE_URL or DATABASE_URL in your .env"
  );
}

const adapter = new PrismaPg({ databaseUrl });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
