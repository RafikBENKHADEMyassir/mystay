// frontend/src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = cookies();

  // Clear server session (httpOnly)
  cookieStore.delete("session");

  // Clear client-readable guest token so middleware and UI see logged-out state
  cookieStore.set("guest_session", "", { path: "/", maxAge: 0, sameSite: "lax" });

  return NextResponse.json({ success: true });
}

export async function GET() {
  const cookieStore = cookies();

  cookieStore.delete("session");
  cookieStore.set("guest_session", "", { path: "/", maxAge: 0, sameSite: "lax" });

  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_URL || "http://localhost:3000"));
}
