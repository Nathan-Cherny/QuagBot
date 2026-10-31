import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL

  const body = await request.json()

  const conversationId = body["conversationId"]
  const userId = body["userId"]
  const message = body["message"]

  const response = await fetch(`${baseUrl}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-ID": userId
    },
    body: JSON.stringify({
      conversation_id: conversationId,
      message: message
    })
  });

  if (!response.ok) {
    throw new Error(
      `Chat failed: ${response.status} ${await response.text()}`
    );
  }

  let parsedSSE = parseSSE(await response.text())

  const responsePayload = parsedSSE.filter(sse => sse.data.status == "completed")[0]
  if(!responsePayload){
    return NextResponse.json(
      { error: `Send message failed (backend returned ${response.status})` },
      { status: 502 }
    );
  }
  
  const payload = responsePayload.data.response

  if (!response.ok) {
    console.error(`AI backend returned ${response.status}:`, text.slice(0, 500));
    return NextResponse.json(
      { error: `Send message failed (backend returned ${response.status})` },
      { status: 502 }
    );
  }

  return NextResponse.json(payload ?? {}, { status: response.status === 201 ? 201 : 200 });
}

export function parseSSE(text) {
  return text
    .split(/\r?\n\r?\n/)               // blocks are separated by a blank line
    .filter((block) => block.trim())
    .map((block) => {
      let event = "message";
      const dataLines = [];
      for (const line of block.split(/\r?\n/)) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
      }
      return { event, data: dataLines.length ? JSON.parse(dataLines.join("\n")) : null };
    });
}