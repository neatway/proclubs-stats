import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/players/claim - Claim a player profile
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { platform, consoleUsername, playerName, personaId, clubId, clubName } = body

    // Validate required fields
    if (!platform || !consoleUsername || !playerName || !personaId) {
      return NextResponse.json(
        { error: "Missing required fields: platform, consoleUsername, playerName, personaId" },
        { status: 400 }
      )
    }

    // Validate platform
    if (platform !== "common-gen5" && platform !== "common-gen4") {
      return NextResponse.json(
        { error: "Invalid platform. Must be 'common-gen5' or 'common-gen4'" },
        { status: 400 }
      )
    }

    // Verify that console username matches one of the user's connected accounts
    const user = session.user
    const matchesConsole =
      (user.psnUsername && user.psnUsername.toLowerCase() === consoleUsername.toLowerCase()) ||
      (user.xboxUsername && user.xboxUsername.toLowerCase() === consoleUsername.toLowerCase()) ||
      (user.pcUsername && user.pcUsername.toLowerCase() === consoleUsername.toLowerCase())

    if (!matchesConsole) {
      return NextResponse.json(
        {
          error: "Console username does not match any of your connected Discord accounts",
          connectedAccounts: {
            psn: user.psnUsername,
            xbox: user.xboxUsername,
            pc: user.pcUsername,
          },
        },
        { status: 400 }
      )
    }

    // Verify that player name matches console username
    if (playerName.toLowerCase() !== consoleUsername.toLowerCase()) {
      return NextResponse.json(
        { error: "Player name must match your console username" },
        { status: 400 }
      )
    }

    // Check if this persona is already claimed by another user
    const existingClaim = await prisma.claimedPlayer.findUnique({
      where: {
        platform_personaId: {
          platform,
          personaId,
        },
      },
      include: {
        user: true,
      },
    })

    if (existingClaim && existingClaim.userId !== user.id) {
      return NextResponse.json(
        {
          error: "This player is already claimed by another user",
          claimedBy: existingClaim.user.username,
        },
        { status: 409 }
      )
    }

    // Create or update the claimed player
    const claimedPlayer = await prisma.claimedPlayer.upsert({
      where: {
        userId_platform_consoleUsername: {
          userId: user.id,
          platform,
          consoleUsername,
        },
      },
      create: {
        userId: user.id,
        platform,
        consoleUsername,
        playerName,
        personaId,
        clubId,
        clubName,
      },
      update: {
        playerName,
        personaId,
        clubId,
        clubName,
        verifiedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, claimedPlayer }, { status: 200 })
  } catch (error) {
    console.error("Error claiming player:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/players/claim - Get user's claimed players
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const claimedPlayers = await prisma.claimedPlayer.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        verifiedAt: "desc",
      },
    })

    return NextResponse.json({ claimedPlayers }, { status: 200 })
  } catch (error) {
    console.error("Error fetching claimed players:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
