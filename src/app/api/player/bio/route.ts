import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const isDev = process.env.NODE_ENV === "development";

// Validation schema
const BioUpdateSchema = z.object({
  playerId: z.string().min(1, "Player ID is required"),
  bio: z.string()
    .max(500, "Bio cannot exceed 500 characters")
    .transform(str => {
      // Strip HTML tags to prevent XSS
      return str.replace(/<[^>]*>/g, '').trim();
    })
    .optional()
    .nullable(),
});

export async function PATCH(request: NextRequest) {
  try {
    // Rate limiting: 10 bio updates per minute per IP
    const ip = getClientIp(request);
    const rateLimitResult = rateLimit(ip, { limit: 10, window: 60 });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input with Zod
    const validation = BioUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validation.error.errors.map(e => e.message)
        },
        { status: 400 }
      );
    }

    const { playerId, bio } = validation.data;

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
    if (isDev) console.error("Error updating bio:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
