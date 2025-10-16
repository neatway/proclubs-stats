"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface ClaimPlayerFormProps {
  psnUsername: string | null
  xboxUsername: string | null
  pcUsername: string | null
}

export default function ClaimPlayerForm({
  psnUsername,
  xboxUsername,
  pcUsername,
}: ClaimPlayerFormProps) {
  const router = useRouter()
  const [platform, setPlatform] = useState<"common-gen5" | "common-gen4">("common-gen5")
  const [consoleUsername, setConsoleUsername] = useState("")
  const [playerName, setPlayerName] = useState("")
  const [personaId, setPersonaId] = useState("")
  const [clubId, setClubId] = useState("")
  const [clubName, setClubName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const hasConsoleAccounts = !!(psnUsername || xboxUsername || pcUsername)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/players/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          consoleUsername,
          playerName,
          personaId,
          clubId: clubId || null,
          clubName: clubName || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to claim player")
      }

      setSuccess("Player claimed successfully!")
      setConsoleUsername("")
      setPlayerName("")
      setPersonaId("")
      setClubId("")
      setClubName("")

      // Refresh the page to show the new claim
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to claim player";
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (!hasConsoleAccounts) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 text-yellow-200">
        <p className="font-semibold mb-2">No console accounts connected</p>
        <p className="text-sm">
          You need to connect your console accounts (PSN, Xbox, or Battle.net) to your Discord account
          before you can claim a player profile. Go to Discord Settings → Connections to link your accounts.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 text-green-200">
          {success}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Platform
        </label>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value as "common-gen5" | "common-gen4")}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="common-gen5">Current Gen (PS5, Xbox Series X/S, PC)</option>
          <option value="common-gen4">Previous Gen (PS4, Xbox One)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Console Username
        </label>
        <input
          type="text"
          value={consoleUsername}
          onChange={(e) => setConsoleUsername(e.target.value)}
          placeholder="Your PSN/Xbox/PC username"
          required
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400"
        />
        <p className="mt-1 text-xs text-slate-400">
          Must match one of your connected accounts: {[psnUsername, xboxUsername, pcUsername].filter(Boolean).join(", ")}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          EA Player Name
        </label>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Your in-game player name"
          required
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400"
        />
        <p className="mt-1 text-xs text-slate-400">
          Must match your console username to verify ownership
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Persona ID
        </label>
        <input
          type="text"
          value={personaId}
          onChange={(e) => setPersonaId(e.target.value)}
          placeholder="Your EA persona ID"
          required
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400"
        />
        <p className="mt-1 text-xs text-slate-400">
          Find this from the EA Pro Clubs website or API
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Club ID (Optional)
        </label>
        <input
          type="text"
          value={clubId}
          onChange={(e) => setClubId(e.target.value)}
          placeholder="Your current club ID"
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Club Name (Optional)
        </label>
        <input
          type="text"
          value={clubName}
          onChange={(e) => setClubName(e.target.value)}
          placeholder="Your current club name"
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
      >
        {loading ? "Claiming..." : "Claim Player"}
      </button>
    </form>
  )
}
