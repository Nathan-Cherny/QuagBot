import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let title = "New Chat";
  try {
    const body = await request.json();
    if (typeof body?.title === "string" && body.title.trim()) {
      title = body.title.trim();
    }
  } catch {
    // No body or invalid JSON: keep the default title.
  }

  let backendResponse;
  try {
    backendResponse = await fetch(`${baseUrl}/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": userId,
      },
      body: JSON.stringify({ title }),
      cache: "no-store",
    });
  } catch (error) {
    console.error("Could not reach the AI backend:", error);
    return NextResponse.json({ error: "Could not reach the AI backend" }, { status: 502 });
  }

  const text = await backendResponse.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
  }

  if (!backendResponse.ok) {
    console.error(`AI backend returned ${backendResponse.status}:`, text.slice(0, 500));
    return NextResponse.json(
      { error: `Create conversation failed (backend returned ${backendResponse.status})` },
      { status: 502 }
    );
  }

  return NextResponse.json(payload ?? {}, { status: backendResponse.status === 201 ? 201 : 200 });
}
