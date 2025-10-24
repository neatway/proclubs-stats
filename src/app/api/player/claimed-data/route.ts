import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get("platform");
    const playerName = searchParams.get("playerName");
    const personaId = searchParams.get("personaId"); // Optional, for backwards compatibility

    if (!platform || (!playerName && !personaId)) {
      return NextResponse.json(
        { error: "Missing platform or playerName" },
        { status: 400 }
      );
    }

    // Find claimed player by playerName (preferred) or personaId (fallback)
    const claimedPlayer = await prisma.claimedPlayer.findFirst({
      where: {
        platform,
        ...(playerName ? { playerName } : { personaId }),
      },
      select: {
        id: true,
        userId: true,
        bio: true,
        profilePictureUrl: true,
        likesCount: true,
        dislikesCount: true,
        verifiedAt: true,
        playerName: true,
        user: {
          select: {
            discordId: true,
            username: true,
            avatarHash: true,
          },
        },
      },
    });

    if (!claimedPlayer) {
      return NextResponse.json({
        claimedPlayer: null,
        userVote: null,
      });
    }

    // Get user's vote if logged in
    let userVote = null;
    if (session?.user?.id) {
      userVote = await prisma.playerLike.findUnique({
        where: {
          playerId_userId: {
            playerId: claimedPlayer.id,
            userId: session.user.id,
          },
        },
        select: {
          action: true,
        },
      });
    }

    return NextResponse.json({
      claimedPlayer,
      userVote,
    });
  } catch (error) {
    console.error("Error fetching claimed player data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
