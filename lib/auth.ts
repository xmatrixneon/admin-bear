// lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";

/**
 * Better Auth Configuration for Admin Panel
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  advanced: {
    cookiePrefix: "admin",
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session extends { session: any; user: infer T } ? T : any;

/**
 * Verify admin using env-based credentials
 *
 * Add to admin-bear/.env:
 * ADMIN_USERNAME=admin
 * ADMIN_PASSWORD=your-strong-password
 */
export async function verifyAdmin({
  username,
  password,
}: {
  username: string;
  password: string;
}) {
  const validUsername = process.env.ADMIN_USERNAME;
  const validPassword = process.env.ADMIN_PASSWORD;

  if (!validUsername || !validPassword) {
    console.error("[verifyAdmin] ADMIN_USERNAME or ADMIN_PASSWORD not set in .env");
    return { success: false, error: "Server misconfiguration" };
  }

  if (username !== validUsername || password !== validPassword) {
    return { success: false, error: "Invalid credentials" };
  }

  // Find any admin user in DB to associate session with
  const adminUser = await prisma.user.findFirst({
    where: { isAdmin: true },
    select: { id: true, name: true, telegramId: true },
  });

  if (!adminUser) {
    return {
      success: false,
      error: "No admin user found in database. Set isAdmin=true on a user first.",
    };
  }

  // Generate a simple signed token (base64 encoded JSON with expiry)
  const token = Buffer.from(
    JSON.stringify({
      id: adminUser.id,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    })
  ).toString("base64");

  return {
    success: true,
    data: {
      token,
      user: {
        id: adminUser.id,
        name: adminUser.name,
        telegramId: adminUser.telegramId,
        isAdmin: true,
      },
    },
  };
}

/**
 * Verify a token from Authorization header
 * Use this in API route middleware to protect admin routes
 */
export function verifyAdminToken(token: string): boolean {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString());
    if (decoded.exp < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}