import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Get the database URL from environment variables
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create a postgres connection
// For serverless functions, we use max: 1 to avoid connection pooling issues
const client = postgres(connectionString, { max: 1 });

// Create the drizzle database instance
export const db = drizzle(client, { schema });

// Export the schema for use in other parts of the application
export * from "./schema";
