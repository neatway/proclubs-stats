import NextAuth, { DefaultSession } from "next-auth"
import Discord from "next-auth/providers/discord"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      discordId: string
      username: string
      discriminator: string | null
      avatarHash: string | null
      psnUsername: string | null
      xboxUsername: string | null
      pcUsername: string | null
      role: string
    } & DefaultSession["user"]
  }

  interface User {
    discordId: string
    username: string
    discriminator: string | null
    avatarHash: string | null
    psnUsername: string | null
    xboxUsername: string | null
    pcUsername: string | null
    role: string
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "identify email connections",
        },
      },
      // Map Discord profile fields to user object
      profile(profile) {
        return {
          id: profile.id,
          name: profile.global_name ?? profile.username,
          email: profile.email,
          image: profile.avatar
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${profile.avatar.startsWith("a_") ? "gif" : "png"}`
            : `https://cdn.discordapp.com/embed/avatars/${parseInt(profile.id) % 5}.png`,
          // Custom fields - these get passed to linkAccount
          discordId: profile.id,
          username: profile.username, // Actual Discord username (e.g., "wassi.")
          discriminator: profile.discriminator ?? null,
          avatarHash: profile.avatar ?? null,
        }
      },
    }),
  ],
  trustHost: true, // Required for Vercel deployment
  events: {
    async linkAccount({ user, account, profile }) {
      // Update user with Discord info after account is linked
      // Profile contains raw Discord API response
      const discordProfile = profile as {
        id: string
        username: string
        global_name?: string
        discriminator?: string
        avatar?: string
      }

      console.log("Discord profile:", {
        id: discordProfile.id,
        username: discordProfile.username,
        global_name: discordProfile.global_name,
        discriminator: discordProfile.discriminator,
      })

      const connections = await fetchDiscordConnections(account.access_token!)

      // Use actual Discord username (e.g., "wassi."), not display name or email
      const username = discordProfile.username || user.email?.split('@')[0] || user.id

      await prisma.user.update({
        where: { id: user.id },
        data: {
          discordId: account.providerAccountId,
          username: username,
          discriminator: discordProfile.discriminator || null,
          avatarHash: discordProfile.avatar || null,
          psnUsername: connections.psn,
          xboxUsername: connections.xbox,
          pcUsername: connections.battlenet,
        },
      })
    },
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        // Extract avatar hash from image URL if not already set
        let avatarHash = user.avatarHash;
        if (!avatarHash && session.user.image) {
          const match = session.user.image.match(/avatars\/\d+\/([a-f0-9_]+)\.(png|gif|jpg)/);
          if (match) {
            avatarHash = match[1];
            // Update the user record with the extracted avatar hash
            await prisma.user.update({
              where: { id: user.id },
              data: { avatarHash },
            });
          }
        }

        session.user.id = user.id
        session.user.discordId = user.discordId
        session.user.username = user.username
        session.user.discriminator = user.discriminator
        session.user.avatarHash = avatarHash
        session.user.psnUsername = user.psnUsername
        session.user.xboxUsername = user.xboxUsername
        session.user.pcUsername = user.pcUsername
        session.user.role = user.role
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "database",
  },
})

// Fetch Discord connections (PSN, Xbox, Battle.net)
async function fetchDiscordConnections(accessToken: string) {
  try {
    const response = await fetch("https://discord.com/api/users/@me/connections", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      console.error("Failed to fetch Discord connections:", response.statusText)
      return { psn: null, xbox: null, battlenet: null }
    }

    const connections = await response.json()

    interface DiscordConnection {
      type: string;
      name?: string;
    }

    const psn = (connections as DiscordConnection[]).find((c) => c.type === "playstation")?.name || null
    const xbox = (connections as DiscordConnection[]).find((c) => c.type === "xbox")?.name || null
    const battlenet = (connections as DiscordConnection[]).find((c) => c.type === "battlenet")?.name || null

    return { psn, xbox, battlenet }
  } catch (error) {
    console.error("Error fetching Discord connections:", error)
    return { psn: null, xbox: null, battlenet: null }
  }
}

// Helper function to generate Discord avatar URL
export function getDiscordAvatarUrl(
  discordId: string,
  avatarHash: string | null,
  size: number = 128
): string {
  if (!avatarHash) {
    // Default Discord avatar
    const defaultAvatarNum = parseInt(discordId) % 5
    return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNum}.png`
  }

  return `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.${
    avatarHash.startsWith("a_") ? "gif" : "png"
  }?size=${size}`
}
