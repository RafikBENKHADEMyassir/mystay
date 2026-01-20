// Seed script to create a platform admin user
import { randomUUID } from "node:crypto";
import { hashPassword } from "../src/auth/password.mjs";
import { query } from "../src/db/postgres.mjs";

const email = "admin@mystay.com";
const password = "admin123";
const displayName = "Platform Admin";

async function seedPlatformAdmin() {
  console.log("Creating platform admin...");

  // Check if admin already exists
  const existing = await query(
    `SELECT id FROM platform_admins WHERE email = $1`,
    [email]
  );

  if (existing.length > 0) {
    console.log(`Platform admin ${email} already exists`);
    process.exit(0);
  }

  const id = randomUUID();
  const passwordHash = await hashPassword(password);

  await query(
    `
      INSERT INTO platform_admins (id, email, password_hash, display_name)
      VALUES ($1, $2, $3, $4)
    `,
    [id, email, passwordHash, displayName]
  );

  console.log(`Created platform admin: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`\nYou can now login at the admin dashboard.`);
  process.exit(0);
}

seedPlatformAdmin().catch((err) => {
  console.error("Failed to seed platform admin:", err);
  process.exit(1);
});
