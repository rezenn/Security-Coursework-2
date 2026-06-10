import { NextResponse } from "next/server";
import { StreamChat } from "stream-chat";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const secret = process.env.STREAM_SECRET;

    if (!apiKey || !secret) {
      return NextResponse.json(
        { error: "Missing Stream credentials" },
        { status: 500 },
      );
    }

    const client = StreamChat.getInstance(apiKey, secret);
    const token = client.createToken(userId);

    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 },
    );
  }
}
