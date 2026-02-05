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
    const { clubId, platform, action } = body;

    if (!clubId || !platform || !action || !["like", "dislike"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid clubId, platform, or action" },
        { status: 400 }
      );
    }

    // Check if user has already voted on this club
    const existingVote = await prisma.clubLike.findUnique({
      where: {
        clubId_platform_userId: {
          clubId,
          platform,
          userId: session.user.id,
        },
      },
    });

    if (existingVote) {
      if (existingVote.action === action) {
        // Same vote - remove it (toggle off)
        await prisma.clubLike.delete({
          where: {
            clubId_platform_userId: {
              clubId,
              platform,
              userId: session.user.id,
            },
          },
        });
        return NextResponse.json({ success: true, action: null });
      } else {
        // Different vote - update it
        await prisma.clubLike.update({
          where: {
            clubId_platform_userId: {
              clubId,
              platform,
              userId: session.user.id,
            },
          },
          data: { action },
        });
        return NextResponse.json({ success: true, action });
      }
    } else {
      // New vote
      await prisma.clubLike.create({
        data: {
          clubId,
          platform,
          userId: session.user.id,
          action,
        },
      });
      return NextResponse.json({ success: true, action });
    }
  } catch (error) {
    console.error("Error processing club vote:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch vote counts and user's current vote
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get("clubId");
    const platform = searchParams.get("platform");

    if (!clubId || !platform) {
      return NextResponse.json(
        { error: "Missing clubId or platform" },
        { status: 400 }
      );
    }

    // Get vote counts
    const [likesCount, dislikesCount] = await Promise.all([
      prisma.clubLike.count({
        where: { clubId, platform, action: "like" },
      }),
      prisma.clubLike.count({
        where: { clubId, platform, action: "dislike" },
      }),
    ]);

    // Check if current user has voted
    const session = await auth();
    let userVote = null;

    if (session?.user?.id) {
      const existingVote = await prisma.clubLike.findUnique({
        where: {
          clubId_platform_userId: {
            clubId,
            platform,
            userId: session.user.id,
          },
        },
      });
      userVote = existingVote?.action || null;
    }

    return NextResponse.json({
      likesCount,
      dislikesCount,
      userVote,
    });
  } catch (error) {
    console.error("Error fetching club votes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
