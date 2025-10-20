import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get("platform");
    const playerNames = searchParams.get("playerNames");
    const personaIds = searchParams.get("personaIds"); // Optional backwards compatibility

    if (!platform || (!playerNames && !personaIds)) {
      return NextResponse.json(
        { error: "Missing platform or playerNames" },
        { status: 400 }
      );
    }

    // Parse comma-separated playerNames (preferred) or personaIds (fallback)
    const namesArray = (playerNames || personaIds)?.split(",").filter(Boolean) || [];

    if (namesArray.length === 0) {
      return NextResponse.json({ claimedPlayers: [] });
    }

    // Query claimed players by playerName or personaId
    const claimedPlayers = await prisma.claimedPlayer.findMany({
      where: {
        platform,
        ...(playerNames
          ? { playerName: { in: namesArray } }
          : { personaId: { in: namesArray } }),
      },
      select: {
        personaId: true,
        userId: true,
        playerName: true,
        verifiedAt: true,
        user: {
          select: {
            discordId: true,
            avatarHash: true,
          },
        },
      },
    });

    return NextResponse.json({
      claimedPlayers,
    });
  } catch (error) {
    console.error("Error fetching claimed status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
