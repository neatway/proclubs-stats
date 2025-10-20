import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { playerId, bio } = body;

    if (!playerId) {
      return NextResponse.json(
        { error: "Missing playerId" },
        { status: 400 }
      );
    }

    // Validate bio length
    if (bio && bio.length > 500) {
      return NextResponse.json(
        { error: "Bio cannot exceed 500 characters" },
        { status: 400 }
      );
    }

    // Check if the player profile belongs to the logged-in user
    const player = await prisma.claimedPlayer.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      return NextResponse.json(
        { error: "Player profile not found" },
        { status: 404 }
      );
    }

    if (player.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only edit your own profile" },
        { status: 403 }
      );
    }

    // Update the bio
    const updatedPlayer = await prisma.claimedPlayer.update({
      where: { id: playerId },
      data: { bio: bio || null },
    });

    return NextResponse.json({
      success: true,
      bio: updatedPlayer.bio,
    });
  } catch (error) {
    console.error("Error updating bio:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
