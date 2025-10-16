import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// DELETE /api/players/[claimId] - Unclaim a player
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ claimId: string }> }
) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { claimId } = await params

    // Verify the claim belongs to the current user
    const claim = await prisma.claimedPlayer.findUnique({
      where: { id: claimId },
    })

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 })
    }

    if (claim.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: This claim belongs to another user" }, { status: 403 })
    }

    // Delete the claim
    await prisma.claimedPlayer.delete({
      where: { id: claimId },
    })

    return NextResponse.json({ success: true, message: "Player unclaimed successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error unclaiming player:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
