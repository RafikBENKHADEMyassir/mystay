// frontend/src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { encrypt } from "@/lib/auth";
import { cookies } from "next/headers";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = loginSchema.parse(body);

    // Call backend to authenticate guest
    const backendRes = await fetch(`${BACKEND_URL}/api/v1/auth/guest/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: validated.email,
        password: validated.password,
      }),
    });

    const backendData = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: backendData.error || "Login failed" },
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
      idDocumentVerified: backendData.guest.idDocumentVerified,
      hasPaymentMethod: backendData.guest.hasPaymentMethod,
      hotelId: backendData.stay?.hotelId ?? null,
      stayId: backendData.stay?.id ?? null,
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

    return NextResponse.json({
      success: true,
      guest: backendData.guest,
      stay: backendData.stay,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation error" },
        { status: 400 }
      );
    }
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
