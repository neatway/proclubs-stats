"use client"

import Link from "next/link"
import { useSession, signIn, signOut } from "next-auth/react"
import { getDiscordAvatarUrl } from "@/lib/auth"

export default function Navigation() {
  const { data: session, status } = useSession()

  return (
    <nav
      className="main-navigation"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '64px',
        backgroundColor: 'var(--bg-header)',
        borderBottom: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
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
          gap: '16px'
        }}
      >
        {/* Logo - Left on mobile, centered on desktop */}
        <Link
          href="/"
          className="nav-logo"
          style={{
            fontFamily: 'var(--font-work-sans), sans-serif',
            fontWeight: 600,
            fontSize: '20px',
            color: 'var(--brand-cyan)',
            textDecoration: 'none',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          PROCLUBS.IO
        </Link>

        {/* Right side - Auth */}
        <div className="nav-auth" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexShrink: 0 }}>
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
      </div>
    </nav>
  )
}
