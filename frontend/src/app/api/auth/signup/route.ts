// frontend/src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { encrypt } from "@/lib/auth";
import { cookies } from "next/headers";

const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().nullable().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = signupSchema.parse(body);

    // Call backend to create guest account
    const backendRes = await fetch(`${BACKEND_URL}/api/v1/auth/guest/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: validated.firstName,
        lastName: validated.lastName,
        email: validated.email,
        phone: validated.phone ?? null,
        password: validated.password,
      }),
    });

    const backendData = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: backendData.error || "Sign up failed" },
        { status: backendRes.status }
      );
    }

    // Create frontend session with the guest data
    const user = {
      guestId: backendData.guest.id,
      firstName: backendData.guest.firstName,
      lastName: backendData.guest.lastName,
      email: backendData.guest.email,
      phone: backendData.guest.phone,
      emailVerified: backendData.guest.emailVerified,
      hotelId: null,
      stayId: null,
    };

    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const session = await encrypt({ user, backendToken: backendData.token, expires });

    // Save the session in a cookie
    cookies().set("session", session, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return NextResponse.json(
      {
        success: true,
        guest: backendData.guest,
        token: backendData.token,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || "Validation error" }, { status: 400 });
    }
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
