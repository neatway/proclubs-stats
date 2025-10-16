import { redirect } from "next/navigation"
import { auth, signOut, getDiscordAvatarUrl } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import ClaimPlayerForm from "@/components/ClaimPlayerForm"
import ClaimedPlayersList from "@/components/ClaimedPlayersList"

export default async function ProfilePage() {
  const session = await auth()

  if (!session || !session.user) {
    redirect("/login")
  }

  const user = session.user

  // Fetch user's claimed players
  const claimedPlayers = await prisma.claimedPlayer.findMany({
    where: { userId: user.id },
    orderBy: { verifiedAt: "desc" },
  })

  // Get follower and following counts
  const followerCount = await prisma.follow.count({
    where: { followingId: user.id },
  })

  const followingCount = await prisma.follow.count({
    where: { followerId: user.id },
  })

  const avatarUrl = getDiscordAvatarUrl(user.discordId, user.avatarHash, 128)

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 mb-6">
          <div className="flex items-start gap-6">
            <img
              src={avatarUrl}
              alt={user.username}
              className="w-24 h-24 rounded-full border-4 border-slate-700"
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">
                {user.username}
              </h1>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-white font-semibold">{followerCount}</span>
                  <span className="text-slate-400"> Followers</span>
                </div>
                <div>
                  <span className="text-white font-semibold">{followingCount}</span>
                  <span className="text-slate-400"> Following</span>
                </div>
              </div>
            </div>
            <form
              action={async () => {
                "use server"
                await signOut({ redirectTo: "/" })
              }}
            >
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>

        {/* Console Accounts Section */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Console Accounts</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300 font-medium">PlayStation Network</span>
              <span className="text-white font-mono">
                {user.psnUsername || <span className="text-slate-500 italic">Not connected</span>}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300 font-medium">Xbox Live</span>
              <span className="text-white font-mono">
                {user.xboxUsername || <span className="text-slate-500 italic">Not connected</span>}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300 font-medium">PC (Battle.net)</span>
              <span className="text-white font-mono">
                {user.pcUsername || <span className="text-slate-500 italic">Not connected</span>}
              </span>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            Console accounts are automatically synced from your Discord connections.
            Update them in Discord to see changes here.
          </p>
        </div>

        {/* Claimed Players Section */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Claimed Players</h2>
          <ClaimedPlayersList claimedPlayers={claimedPlayers} />
        </div>

        {/* Claim Player Form */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Claim a Player Profile</h2>
          <ClaimPlayerForm
            psnUsername={user.psnUsername}
            xboxUsername={user.xboxUsername}
            pcUsername={user.pcUsername}
          />
        </div>
      </div>
    </div>
  )
}
