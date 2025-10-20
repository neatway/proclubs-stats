"use client"

import Link from "next/link"
import { useSession, signIn, signOut } from "next-auth/react"
import { getDiscordAvatarUrl } from "@/lib/auth"

export default function Navigation() {
  const { data: session, status } = useSession()

  return (
    <nav
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
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 24px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Left side spacing */}
        <div style={{ width: '200px' }} />

        {/* Logo - Centered */}
        <Link
          href="/"
          style={{
            fontFamily: 'var(--font-work-sans), sans-serif',
            fontWeight: 600,
            fontSize: '28px',
            color: 'var(--brand-cyan)',
            textDecoration: 'none',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}
        >
          PROCLUBS.IO
        </Link>

        {/* Right side - Auth */}
        <div style={{ width: '200px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          {status === 'loading' ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading...</div>
          ) : session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <img
                src={getDiscordAvatarUrl(session.user.discordId, session.user.avatarHash, 40)}
                alt={session.user.username}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '2px solid var(--brand-cyan)'
                }}
              />
              <span style={{
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
                  padding: '6px 16px',
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
                padding: '8px 20px',
                fontSize: '13px'
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
