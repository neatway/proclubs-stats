"use client"

import Link from "next/link"
import { useSession, signIn, signOut } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { getDiscordAvatarUrl } from "@/lib/auth"
import Logo from "@/components/Logo"

export default function Navigation() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  const isHomePage = pathname === '/'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}&platform=common-gen5`)
      setSearchQuery('')
      setSearchOpen(false)
    }
  }

  const closeSearch = () => {
    setSearchOpen(false)
    setSearchQuery('')
  }

  return (
    <nav
      className="main-navigation"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '64px',
        background: '#1D1D1D',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
        zIndex: 1000
      }}
    >
      <div
        className="nav-container"
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 var(--container-padding)',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px'
        }}
      >
        {/* Mobile search expanded view */}
        {searchOpen && !isHomePage && (
          <div className="nav-mobile-search-expanded" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%'
          }}>
            {/* Back button */}
            <button
              onClick={closeSearch}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0
              }}
              aria-label="Close search"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Search input - full width */}
            <form onSubmit={handleSearch} style={{ flex: 1 }}>
              <div style={{
                background: '#2D2D2D',
                borderRadius: '8px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Search clubs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    outline: 'none',
                    fontSize: '14px',
                    width: '100%'
                  }}
                />
              </div>
            </form>

            {/* Close button */}
            <button
              onClick={closeSearch}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0
              }}
              aria-label="Clear search"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Normal navigation (hidden when mobile search is open) */}
        {!searchOpen && (
          <>
            {/* Left side - Logo + Search */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              flex: 1
            }}>
              {/* Logo */}
              <Link
                href="/"
                className="nav-logo"
                style={{
                  textDecoration: 'none',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Logo size="small" className="nav-logo-responsive" />
              </Link>

              {/* Desktop search box - only show if not on homepage */}
              {!isHomePage && (
                <form onSubmit={handleSearch} className="nav-desktop-search" style={{ flex: 1, maxWidth: '500px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#2D2D2D',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    gap: '8px',
                    minWidth: '300px'
                  }}>
                    {/* Search icon */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>

                    {/* Search input */}
                    <input
                      type="text"
                      placeholder="Search clubs"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#FFFFFF',
                        outline: 'none',
                        fontSize: '14px',
                        width: '100%'
                      }}
                    />
                  </div>
                </form>
              )}
            </div>

            {/* Right side - Search icon (mobile) + Auth */}
            <div className="nav-auth" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              {/* Mobile search icon button */}
              {!isHomePage && (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="nav-mobile-search-btn"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    padding: '8px',
                    display: 'none',
                    alignItems: 'center'
                  }}
                  aria-label="Open search"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </button>
              )}

              {status === 'loading' ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading...</div>
              ) : session ? (
                <div className="nav-user-info" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <img
                    src={getDiscordAvatarUrl(session.user.discordId, session.user.avatarHash, 40)}
                    alt={session.user.username}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: '2px solid var(--brand-cyan)',
                      flexShrink: 0
                    }}
                  />
                  <span className="nav-username" style={{
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 500
                  }}>
                    {session.user.username}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="btn-secondary"
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px'
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signIn('discord')}
                  className="btn-primary"
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Sign In
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  )
}
