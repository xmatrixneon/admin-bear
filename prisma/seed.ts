import { hash } from "bcryptjs";
import { prisma } from "../lib/db";

async function main() {
  const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@meowsms.com";
  const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || "admin123";

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: defaultEmail },
  });

  if (existingAdmin) {
    console.log("Admin user already exists:", defaultEmail);
    return;
  }

  // Hash the password
  const hashedPassword = await hash(defaultPassword, 10);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: defaultEmail,
      emailVerified: true,
      name: "Admin",
      isAdmin: true,
      // Create associated wallet
      wallet: {
        create: {
          balance: 0,
          totalSpent: 0,
          totalOtp: 0,
          totalRecharge: 0,
        },
      },
      // Create user data
      userData: {
        create: {
          status: "ACTIVE",
          apiCalls: 0,
        },
      },
    },
  });

  console.log("Admin user created successfully!");
  console.log("Email:", defaultEmail);
  console.log("Password:", defaultPassword);
  console.log("Please change the password after first login!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
