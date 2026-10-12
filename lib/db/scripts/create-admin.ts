import { hash } from "bcryptjs";
import { db } from "../client";
import { emailEquals } from "../email-match";
import { adminUsers } from "../schema";

/**
 * Create an admin from environment variables (never commit credentials):
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='long-random-password' \
 *   ADMIN_NAME='Your Name' pnpm db:create-admin
 *
 * ADMIN_ROLE defaults to super_admin, which can manage the rest of the team.
 */
async function createAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || null;
  const role = process.env.ADMIN_ROLE === "admin" ? "admin" : "super_admin";

  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD");
  }
  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters");
  }

  const [existing] = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(emailEquals(adminUsers.email, email))
    .limit(1);

  if (existing) {
    console.log("Admin already exists:", email);
    return;
  }

  const [admin] = await db
    .insert(adminUsers)
    .values({
      email,
      name,
      passwordHash: await hash(password, 10),
      role,
      isActive: true,
    })
    .returning({ email: adminUsers.email, role: adminUsers.role });

  console.log(`Created ${admin?.role} ${admin?.email}`);
}

createAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
