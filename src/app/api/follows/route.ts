import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/follows - Follow a user
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { followingId } = body

    if (!followingId) {
      return NextResponse.json({ error: "Missing followingId" }, { status: 400 })
    }

    // Prevent self-following
    if (followingId === session.user.id) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: followingId },
    })

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId,
        },
      },
    })

    if (existingFollow) {
      return NextResponse.json({ error: "Already following this user" }, { status: 409 })
    }

    // Create follow relationship
    const follow = await prisma.follow.create({
      data: {
        followerId: session.user.id,
        followingId,
      },
    })

    return NextResponse.json({ success: true, follow }, { status: 201 })
  } catch (error) {
    console.error("Error following user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
