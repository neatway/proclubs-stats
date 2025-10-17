"use client"

import Link from "next/link"

export default function Navigation() {
  // Simplified navigation without auth for now
  // Can be enhanced later with client-side session management

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
          </div>
        </div>
      </div>
    </nav>
  )
}
