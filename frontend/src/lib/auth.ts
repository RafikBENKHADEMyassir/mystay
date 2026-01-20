// frontend/src/lib/auth.ts
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const secretKey = process.env.SESSION_SECRET || "mystay-dev-secret-change-in-production";
const key = new TextEncoder().encode(secretKey);

export type GuestUser = {
  guestId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  emailVerified?: boolean;
  idDocumentVerified?: boolean;
  hasPaymentMethod?: boolean;
  hotelId?: string | null;
  stayId?: string | null;
};

export type Session = {
  user: GuestUser;
  backendToken: string;
  expires: Date;
};

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function decrypt(input: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    });
    return payload as unknown as Session;
  } catch (error) {
    console.error("JWT decryption failed:", error);
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const session = cookies().get("session")?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function getUser(): Promise<GuestUser | null> {
  const session = await getSession();
  return session?.user ?? null;
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.user?.guestId;
}

export async function hasActiveStay(): Promise<boolean> {
  const session = await getSession();
  return !!session?.user?.stayId;
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  if (!session) return;

  const parsed = await decrypt(session);
  if (!parsed) return;

  // Refresh the session so it doesn't expire
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const res = NextResponse.next();
  res.cookies.set({
    name: "session",
    value: await encrypt({ ...parsed, expires }),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires,
  });
  return res;
}

export async function clearSession() {
  cookies().delete("session");
}
