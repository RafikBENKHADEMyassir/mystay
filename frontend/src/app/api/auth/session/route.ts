// frontend/src/app/api/auth/session/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ authenticated: false, user: null, stay: null, backendToken: null });
  }

  return NextResponse.json({
    authenticated: true,
    backendToken: session.backendToken ?? null,
    user: {
      guestId: session.user.guestId,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      email: session.user.email,
      phone: session.user.phone,
      emailVerified: session.user.emailVerified,
      idDocumentVerified: session.user.idDocumentVerified,
      hasPaymentMethod: session.user.hasPaymentMethod,
    },
    stay: session.user.stayId
      ? {
          hotelId: session.user.hotelId,
          stayId: session.user.stayId,
        }
      : null,
  });
}
