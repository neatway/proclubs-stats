import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// DELETE /api/follows/[followingId] - Unfollow a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { followingId: string } }
) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { followingId } = params

    // Find and delete the follow relationship
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId,
        },
      },
    })

    if (!follow) {
      return NextResponse.json({ error: "Follow relationship not found" }, { status: 404 })
    }

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId,
        },
      },
    })

    return NextResponse.json({ success: true, message: "Unfollowed successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error unfollowing user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
