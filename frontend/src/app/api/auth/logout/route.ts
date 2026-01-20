// frontend/src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  // Clear the session cookie
  cookies().delete("session");

  return NextResponse.json({ success: true });
}

export async function GET() {
  // Also support GET for easy linking
  cookies().delete("session");

  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_URL || "http://localhost:3000"));
}
