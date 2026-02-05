import { NextRequest, NextResponse } from "next/server";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Forward to backend
    const backendFormData = new FormData();
    backendFormData.append("file", file);

    const response = await fetch(`${backendUrl}/api/v1/upload`, {
      method: "POST",
      body: backendFormData
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: "Upload failed" }));
      return NextResponse.json(data, { status: response.status });
    }

    const data = await response.json();
    
    // Return full backend URL so frontend can access it
    const fullUrl = `${backendUrl}${data.url}`;
    return NextResponse.json({ url: fullUrl }, { status: 200 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
