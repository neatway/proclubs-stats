import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  // Protect health endpoint - only authenticated users can access
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    user: session.user.username,
    env: {
      hasAuthSecret: !!process.env.AUTH_SECRET,
      hasAuthUrl: !!process.env.AUTH_URL,
      hasDiscordClientId: !!process.env.DISCORD_CLIENT_ID,
      hasDiscordClientSecret: !!process.env.DISCORD_CLIENT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
    },
  };

  return NextResponse.json(health);
}
