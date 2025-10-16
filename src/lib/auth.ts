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
  adapter: PrismaAdapter(prisma),
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
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || !profile) return false

      // Fetch Discord connections to get console usernames
      const connections = await fetchDiscordConnections(account.access_token!)

      // Update user with Discord info and console usernames
      await prisma.user.upsert({
        where: { discordId: account.providerAccountId },
        create: {
          discordId: account.providerAccountId,
          username: (profile as any).username || "",
          discriminator: (profile as any).discriminator || null,
          email: (profile as any).email || null,
          avatarHash: (profile as any).avatar || null,
          psnUsername: connections.psn,
          xboxUsername: connections.xbox,
          pcUsername: connections.battlenet,
        },
        update: {
          username: (profile as any).username || "",
          discriminator: (profile as any).discriminator || null,
          email: (profile as any).email || null,
          avatarHash: (profile as any).avatar || null,
          psnUsername: connections.psn,
          xboxUsername: connections.xbox,
          pcUsername: connections.battlenet,
        },
      })

      return true
    },
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

    const psn = connections.find((c: any) => c.type === "playstation")?.name || null
    const xbox = connections.find((c: any) => c.type === "xbox")?.name || null
    const battlenet = connections.find((c: any) => c.type === "battlenet")?.name || null

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
