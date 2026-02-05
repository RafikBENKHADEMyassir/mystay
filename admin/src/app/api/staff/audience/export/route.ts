import { NextResponse } from "next/server";

import { getStaffToken } from "@/lib/staff-token";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

export async function GET(request: Request) {
  const token = getStaffToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const query = url.searchParams.toString();

  const backendRes = await fetch(query ? `${backendUrl}/api/v1/staff/audience/export?${query}` : `${backendUrl}/api/v1/staff/audience/export`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });

  const body = await backendRes.arrayBuffer();
  const headers = new Headers();
  const contentType = backendRes.headers.get("content-type");
  const contentDisposition = backendRes.headers.get("content-disposition");
  if (contentType) headers.set("content-type", contentType);
  if (contentDisposition) headers.set("content-disposition", contentDisposition);

  return new NextResponse(body, { status: backendRes.status, headers });
}

