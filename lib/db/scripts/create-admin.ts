import { hash } from "bcryptjs";
import prisma from "../../prisma";

async function createAdmin() {
  const email = "embroconnect3@gmail.com";
  const password = "08023029886";
  const name = "Chijioke Uzodinma";

  // Check if admin already exists
  const existing = await prisma.adminUser.findUnique({
    where: { email }
  });

  if (existing) {
    console.log("❌ Admin user already exists with email:", email);
    return;
  }

  const passwordHash = await hash(password, 10);

  const admin = await prisma.adminUser.create({
    data: {
      email,
      name,
      passwordHash,
      role: "admin",
      isActive: true
    }
  });

  console.log("✅ Admin user created successfully!");
  console.log("\nLogin Credentials:");
  console.log("==================");
  console.log(`Email:    ${admin.email}`);
  console.log(`Password: ${password}`);
  console.log("\n⚠️  IMPORTANT: Change this password immediately after first login!");
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