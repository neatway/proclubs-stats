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
    const { playerId, action } = body;

    if (!playerId || !action || !["like", "dislike"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid playerId or action" },
        { status: 400 }
      );
    }

    // Check if player exists
    const player = await prisma.claimedPlayer.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    // Check if user has already voted
    const existingVote = await prisma.playerLike.findUnique({
      where: {
        playerId_userId: {
          playerId,
          userId: session.user.id,
        },
      },
    });

    // Use a transaction to update vote and counts atomically
    await prisma.$transaction(async (tx) => {
      if (existingVote) {
        // User has voted before
        if (existingVote.action === action) {
          // Same vote - remove it (toggle off)
          await tx.playerLike.delete({
            where: {
              playerId_userId: {
                playerId,
                userId: session.user.id,
              },
            },
          });

          // Decrement the count
          if (action === "like") {
            await tx.claimedPlayer.update({
              where: { id: playerId },
              data: { likesCount: { decrement: 1 } },
            });
          } else {
            await tx.claimedPlayer.update({
              where: { id: playerId },
              data: { dislikesCount: { decrement: 1 } },
            });
          }
        } else {
          // Different vote - update it
          await tx.playerLike.update({
            where: {
              playerId_userId: {
                playerId,
                userId: session.user.id,
              },
            },
            data: { action },
          });

          // Update counts (decrement old, increment new)
          if (action === "like") {
            await tx.claimedPlayer.update({
              where: { id: playerId },
              data: {
                likesCount: { increment: 1 },
                dislikesCount: { decrement: 1 },
              },
            });
          } else {
            await tx.claimedPlayer.update({
              where: { id: playerId },
              data: {
                likesCount: { decrement: 1 },
                dislikesCount: { increment: 1 },
              },
            });
          }
        }
      } else {
        // New vote
        await tx.playerLike.create({
          data: {
            playerId,
            userId: session.user.id,
            action,
          },
        });

        // Increment the count
        if (action === "like") {
          await tx.claimedPlayer.update({
            where: { id: playerId },
            data: { likesCount: { increment: 1 } },
          });
        } else {
          await tx.claimedPlayer.update({
            where: { id: playerId },
            data: { dislikesCount: { increment: 1 } },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing vote:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
