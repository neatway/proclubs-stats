"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface ClaimedPlayer {
  id: string
  platform: string
  consoleUsername: string
  playerName: string
  personaId: string | null
  clubId: string | null
  clubName: string | null
  verifiedAt: Date
}

interface ClaimedPlayersListProps {
  claimedPlayers: ClaimedPlayer[]
}

export default function ClaimedPlayersList({ claimedPlayers }: ClaimedPlayersListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleUnclaim = async (claimId: string) => {
    if (!confirm("Are you sure you want to unclaim this player?")) {
      return
    }

    setDeletingId(claimId)

    try {
      const response = await fetch(`/api/players/${claimId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to unclaim player")
      }

      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to unclaim player";
      alert(message)
    } finally {
      setDeletingId(null)
    }
  }

  if (claimedPlayers.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <p>You haven&apos;t claimed any players yet.</p>
        <p className="text-sm mt-2">Use the form below to claim your first player profile.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {claimedPlayers.map((claim) => (
        <div
          key={claim.id}
          className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-white">{claim.playerName}</h3>
                <span className="px-2 py-1 bg-slate-600 text-slate-300 text-xs rounded-full">
                  {claim.platform === "common-gen5" ? "Current Gen" : "Previous Gen"}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="text-slate-300">
                  <span className="text-slate-400">Console: </span>
                  {claim.consoleUsername}
                </div>
                <div className="text-slate-300">
                  <span className="text-slate-400">Persona ID: </span>
                  {claim.personaId}
                </div>
                {claim.clubName && (
                  <div className="text-slate-300">
                    <span className="text-slate-400">Club: </span>
                    {claim.clubName}
                  </div>
                )}
                <div className="text-slate-400 text-xs mt-2">
                  Verified: {new Date(claim.verifiedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <button
              onClick={() => handleUnclaim(claim.id)}
              disabled={deletingId === claim.id}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
            >
              {deletingId === claim.id ? "Removing..." : "Unclaim"}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
