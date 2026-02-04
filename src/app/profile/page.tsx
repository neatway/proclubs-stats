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
    <div
      style={{
        minHeight: "100vh",
        paddingTop: "88px",
        paddingBottom: "48px",
        paddingLeft: "24px",
        paddingRight: "24px",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Profile Header */}
        <div
          style={{
            background: "var(--bg-secondary)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border-default)",
            padding: "var(--space-xl)",
            marginBottom: "var(--space-lg)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Top accent */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "3px",
              background: "linear-gradient(90deg, var(--brand-cyan), var(--brand-cyan-hover))",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "var(--space-lg)",
              flexWrap: "wrap",
            }}
          >
            <img
              src={avatarUrl}
              alt={user.username}
              style={{
                width: "96px",
                height: "96px",
                borderRadius: "var(--radius-full)",
                border: "3px solid var(--brand-cyan)",
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: "200px" }}>
              <h1
                style={{
                  fontFamily: "var(--font-work-sans), sans-serif",
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: "var(--space-sm)",
                }}
              >
                {user.username}
              </h1>
              <div
                style={{
                  display: "flex",
                  gap: "var(--space-lg)",
                  fontSize: "14px",
                }}
              >
                <div>
                  <span
                    style={{
                      fontFamily: "var(--font-ibm-plex-mono), monospace",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    {followerCount}
                  </span>
                  <span style={{ color: "var(--text-muted)", marginLeft: "6px" }}>
                    Followers
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      fontFamily: "var(--font-ibm-plex-mono), monospace",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    {followingCount}
                  </span>
                  <span style={{ color: "var(--text-muted)", marginLeft: "6px" }}>
                    Following
                  </span>
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
                style={{
                  padding: "10px 20px",
                  background: "var(--danger)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-work-sans), sans-serif",
                  fontWeight: 600,
                  fontSize: "13px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  transition: "all var(--transition-base)",
                }}
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>

        {/* Console Accounts Section */}
        <div
          style={{
            background: "var(--bg-secondary)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border-subtle)",
            padding: "var(--space-xl)",
            marginBottom: "var(--space-lg)",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-work-sans), sans-serif",
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "var(--space-lg)",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Console Accounts
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
            {[
              { label: "PlayStation Network", value: user.psnUsername },
              { label: "Xbox Live", value: user.xboxUsername },
              { label: "PC (Battle.net)", value: user.pcUsername },
            ].map((account) => (
              <div
                key={account.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  background: "var(--bg-tertiary)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <span
                  style={{
                    color: "var(--text-secondary)",
                    fontWeight: 500,
                    fontSize: "14px",
                  }}
                >
                  {account.label}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                    fontWeight: 600,
                    color: account.value ? "var(--text-primary)" : "var(--text-disabled)",
                    fontSize: "14px",
                    fontStyle: account.value ? "normal" : "italic",
                  }}
                >
                  {account.value || "Not connected"}
                </span>
              </div>
            ))}
          </div>
          <p
            style={{
              marginTop: "var(--space-md)",
              fontSize: "13px",
              color: "var(--text-muted)",
            }}
          >
            Console accounts are automatically synced from your Discord connections.
            Update them in Discord to see changes here.
          </p>
        </div>

        {/* Claimed Players Section */}
        <div
          style={{
            background: "var(--bg-secondary)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border-subtle)",
            padding: "var(--space-xl)",
            marginBottom: "var(--space-lg)",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-work-sans), sans-serif",
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "var(--space-lg)",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Claimed Players
          </h2>
          <ClaimedPlayersList claimedPlayers={claimedPlayers} />
        </div>

        {/* Claim Player Form */}
        <div
          style={{
            background: "var(--bg-secondary)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border-subtle)",
            padding: "var(--space-xl)",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-work-sans), sans-serif",
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "var(--space-lg)",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Claim a Player Profile
          </h2>
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
