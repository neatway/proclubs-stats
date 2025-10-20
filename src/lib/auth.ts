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
      console.log("Discord profile:", profile)
      const connections = await fetchDiscordConnections(account.access_token!)

      const discordProfile = profile as Record<string, unknown>
      const username = (discordProfile.global_name || discordProfile.username || user.email?.split('@')[0] || user.id) as string

      await prisma.user.update({
        where: { id: user.id },
        data: {
          discordId: account.providerAccountId,
          username: username,
          discriminator: (discordProfile.discriminator as string | null) || null,
          avatarHash: (discordProfile.avatar as string | null) || null,
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
        // Check if we need to update missing data
        if (!user.avatarHash || !user.username || user.username === user.id) {
          // Extract avatar hash from image URL if available
          let avatarHash = user.avatarHash;
          if (!avatarHash && session.user.image) {
            const match = session.user.image.match(/avatars\/\d+\/([a-f0-9_]+)\.(png|gif|jpg)/);
            if (match) {
              avatarHash = match[1];
            }
          }

          // Use name as username if username is missing or is the ID
          const username = (!user.username || user.username === user.id) ? session.user.name || user.email?.split('@')[0] || user.id : user.username;

          // Update the user record if we found missing data
          if (avatarHash || username !== user.username) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                ...(avatarHash && { avatarHash }),
                ...(username !== user.username && { username }),
              },
            });
          }

          session.user.avatarHash = avatarHash;
          session.user.username = username;
        } else {
          session.user.username = user.username;
          session.user.avatarHash = user.avatarHash;
        }

        session.user.id = user.id
        session.user.discordId = user.discordId
        session.user.discriminator = user.discriminator
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
