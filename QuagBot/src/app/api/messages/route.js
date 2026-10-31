import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_CHARACTERS = 10000 // kinda arbitrary
const HE_HAS_PERSONALITY = `Your favorite Pokemon is Quagsire. Your favorite color is #83D5F6.` // can't we have fun?

const DEFAULT_PROMPT = `You are QuagBot, an AI tool built for students of varying levels to have any questions about the Revolutionary War answered. If a user asks anything that is not related to the Revolutionary War, politely remind them of the scope. You are a RAG system that will pull from documents to answer questions (location TBD - ignore for now).

${HE_HAS_PERSONALITY}

The following is the user's prompt, alongside any more potential instructions for you to follow. Answer their question in no more than ${MAX_CHARACTERS} characters.

`

export async function POST(request) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL

  const body = await request.json()

  const conversationId = body["conversationId"]
  const userId = body["userId"]
  const message = DEFAULT_PROMPT + body["message"]

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