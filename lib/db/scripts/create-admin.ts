import { hash } from "bcryptjs";
import { db } from "../client";
import { adminUsers } from "../schema";
import { eq } from "drizzle-orm";

async function createAdmin() {
  const email = "embroconnect3@gmail.com";
  const password = "08023029886";
  const name = "Chijioke Uzodinma";

  const [existing] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);

  if (existing) {
    console.log("❌ Admin user already exists with email:", email);
    return;
  }

  const passwordHash = await hash(password, 10);

  const [admin] = await db
    .insert(adminUsers)
    .values({
      email,
      name,
      passwordHash,
      role: "admin",
      isActive: true,
    })
    .returning();

  console.log("✅ Admin user created successfully!");
  console.log("\nLogin Credentials:");
  console.log("==================");
  console.log(`Email:    ${admin?.email}`);
  console.log(`Password: ${password}`);
  console.log(
    "\n⚠️  IMPORTANT: Change this password immediately after first login!",
  );
}

createAdmin()
  .then(() => {
    console.log("\n✓ Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
