"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function NavigationClient() {
  const { data: session, status } = useSession();

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

            {status === "loading" ? (
              <div className="text-slate-400">Loading...</div>
            ) : session?.user ? (
              // Authenticated
              <div className="flex items-center gap-4">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-600 border-2 border-slate-500" />
                  <span className="font-medium">{session.user.name || session.user.email}</span>
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
  );
}
