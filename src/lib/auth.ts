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
    }),
  ],
  trustHost: true, // Required for Vercel deployment
  events: {
    async linkAccount({ user, account, profile }) {
      // Update user with Discord info after account is linked
      const connections = await fetchDiscordConnections(account.access_token!)

      await prisma.user.update({
        where: { id: user.id },
        data: {
          discordId: account.providerAccountId,
          username: (profile as Record<string, unknown>).username as string || user.id,
          discriminator: (profile as Record<string, unknown>).discriminator as string | null || null,
          avatarHash: (profile as Record<string, unknown>).avatar as string | null || null,
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
        session.user.id = user.id
        session.user.discordId = user.discordId
        session.user.username = user.username
        session.user.discriminator = user.discriminator
        session.user.avatarHash = user.avatarHash
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
