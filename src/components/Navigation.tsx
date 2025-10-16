import Link from "next/link"
import { auth, getDiscordAvatarUrl } from "@/lib/auth"

export default async function Navigation() {
  const session = await auth()

  return (
    <nav className="bg-slate-800 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold text-white">
              Pro Clubs Stats Hub
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Home
            </Link>

            {session?.user ? (
              // Authenticated
              <div className="flex items-center gap-4">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                >
                  <img
                    src={getDiscordAvatarUrl(session.user.discordId, session.user.avatarHash, 32)}
                    alt={session.user.username}
                    className="w-8 h-8 rounded-full border-2 border-slate-600"
                  />
                  <span className="font-medium">{session.user.username}</span>
                </Link>
              </div>
            ) : (
              // Not authenticated
              <Link
                href="/login"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
