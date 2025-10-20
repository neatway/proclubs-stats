import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { playerName, personaId, clubId, clubName, platform } = body;

    if (!playerName || !platform) {
      return NextResponse.json(
        { error: "Missing required fields: playerName and platform" },
        { status: 400 }
      );
    }

    // Get the user's console username based on platform
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        psnUsername: true,
        xboxUsername: true,
        pcUsername: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Determine which console username to use
    const consoleUsername =
      user.psnUsername || user.xboxUsername || user.pcUsername;

    if (!consoleUsername) {
      return NextResponse.json(
        {
          error:
            "No console account linked. Please link your PSN, Xbox, or PC account through Discord.",
        },
        { status: 400 }
      );
    }

    // Verify that the console username matches the player name (case-insensitive)
    if (consoleUsername.toLowerCase() !== playerName.toLowerCase()) {
      return NextResponse.json(
        {
          error:
            "Console username does not match player name. You can only claim profiles that match your console username.",
        },
        { status: 403 }
      );
    }

    // Check if this player profile is already claimed by someone else
    const existingClaim = await prisma.claimedPlayer.findFirst({
      where: {
        platform,
        playerName,
        NOT: {
          userId: session.user.id,
        },
      },
    });

    if (existingClaim) {
      return NextResponse.json(
        { error: "This player profile has already been claimed by another user." },
        { status: 409 }
      );
    }

    // Check if the user has already claimed this player
    const userExistingClaim = await prisma.claimedPlayer.findFirst({
      where: {
        userId: session.user.id,
        platform,
        playerName,
      },
    });

    if (userExistingClaim) {
      return NextResponse.json(
        { error: "You have already claimed this player profile." },
        { status: 409 }
      );
    }

    // Create the claimed player record
    const claimedPlayer = await prisma.claimedPlayer.create({
      data: {
        userId: session.user.id,
        platform,
        consoleUsername,
        playerName,
        personaId,
        clubId,
        clubName,
      },
    });

    return NextResponse.json({
      success: true,
      claimedPlayer,
    });
  } catch (error) {
    console.error("Error claiming player:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
