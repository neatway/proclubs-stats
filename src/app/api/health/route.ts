import { NextResponse } from "next/server";

export async function GET() {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    env: {
      hasAuthSecret: !!process.env.AUTH_SECRET,
      hasAuthUrl: !!process.env.AUTH_URL,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      authUrl: process.env.AUTH_URL,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      hasDiscordClientId: !!process.env.DISCORD_CLIENT_ID,
      hasDiscordClientSecret: !!process.env.DISCORD_CLIENT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseHost: process.env.DATABASE_URL?.includes("aws-1-us-east-1") ? "correct (aws-1)" : "WRONG - check for typo!",
    },
  };

  return NextResponse.json(health);
}
