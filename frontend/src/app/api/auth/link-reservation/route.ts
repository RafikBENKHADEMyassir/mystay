// frontend/src/app/api/auth/link-reservation/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession, encrypt } from "@/lib/auth";
import { cookies } from "next/headers";

const linkSchema = z.object({
  confirmationNumber: z.string().min(1, "Confirmation number is required"),
});

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await getSession();
    if (!session?.backendToken) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = linkSchema.parse(body);

    // Call backend to link reservation
    const backendRes = await fetch(`${BACKEND_URL}/api/v1/auth/guest/link-reservation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.backendToken}`,
      },
      body: JSON.stringify({
        confirmationNumber: validated.confirmationNumber,
      }),
    });

    const backendData = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: backendData.error || "Failed to link reservation" },
        { status: backendRes.status }
      );
    }

    // Update the frontend session with the new hotel/stay info
    const updatedUser = {
      ...session.user,
      hotelId: backendData.stay.hotelId,
      stayId: backendData.stay.id,
    };

    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const newSession = await encrypt({
      user: updatedUser,
      backendToken: backendData.token,
      expires,
    });

    // Update the session cookie
    cookies().set("session", newSession, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return NextResponse.json({
      success: true,
      stay: backendData.stay,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation error" },
        { status: 400 }
      );
    }
    console.error("Link reservation error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
