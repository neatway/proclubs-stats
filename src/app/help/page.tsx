"use client"

import Link from "next/link";

export default function HelpPage() {
  return (
    <div style={{
      minHeight: '100vh',
      paddingTop: '80px',
      paddingBottom: '48px',
      paddingLeft: '24px',
      paddingRight: '24px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            marginBottom: '16px',
            color: '#FFFFFF'
          }}>
            Help & Getting Started
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: '18px' }}>
            Everything you need to know about using proclubs.io
          </p>
        </div>

        {/* Discord CTA - Top Priority */}
        <div style={{
          marginBottom: '32px',
          padding: '24px',
          borderRadius: '12px',
          background: 'rgba(88, 101, 242, 0.15)',
          border: '1px solid rgba(88, 101, 242, 0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            {/* Discord Logo */}
            <div style={{ flexShrink: 0 }}>
              <svg width="48" height="48" viewBox="0 0 71 55" fill="none">
                <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="#5865F2"/>
              </svg>
            </div>

            {/* Content */}
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#5865F2' }}>
                Need More Help?
              </h2>
              <p style={{ color: '#D1D5DB', marginBottom: '16px' }}>
                Join our Discord community for live support, updates, and to connect with other players!
              </p>
              <a
                href="https://discord.gg/qgtjykTCvY"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  background: '#5865F2',
                  color: 'white',
                  textDecoration: 'none',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#4752C4'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#5865F2'}
              >
                <svg width="20" height="20" viewBox="0 0 71 55" fill="currentColor">
                  <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"/>
                </svg>
                Join Discord Server
              </a>
            </div>
          </div>
        </div>

        {/* Section 1: What is proclubs.io? */}
        <section style={{ marginBottom: '32px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(to right, #60A5FA, #00D9FF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                color: '#000'
              }}>
                1
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFFFFF' }}>What is proclubs.io?</h2>
            </div>
            <div style={{ color: '#D1D5DB', lineHeight: '1.6' }}>
              <p style={{ marginBottom: '12px' }}>
                Proclubs.io is a comprehensive statistics platform for EA Sports FC Pro Clubs. Our platform allows you to:
              </p>
              <ul style={{ marginLeft: '20px', marginBottom: '12px' }}>
                <li style={{ marginBottom: '8px' }}>View detailed player and club statistics</li>
                <li style={{ marginBottom: '8px' }}>Track your performance across matches</li>
                <li style={{ marginBottom: '8px' }}>Claim and customize your player profile</li>
                <li style={{ marginBottom: '8px' }}>Compare stats with other players</li>
              </ul>
              <p style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '16px' }}>
                All data is pulled directly from EA&apos;s servers in real-time, ensuring accuracy and up-to-date information.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Signing in with Discord */}
        <section style={{ marginBottom: '32px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(to right, #60A5FA, #00D9FF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                color: '#000'
              }}>
                2
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFFFFF' }}>Signing in with Discord</h2>
            </div>

            <div style={{ color: '#D1D5DB', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', marginBottom: '12px' }}>Why Discord?</h3>
                <ul style={{ marginLeft: '20px' }}>
                  <li style={{ marginBottom: '8px' }}>Verify your identity through Discord OAuth</li>
                  <li style={{ marginBottom: '8px' }}>Connect console accounts that are already linked to Discord</li>
                  <li style={{ marginBottom: '8px' }}>Automatic verification - no manual proof needed</li>
                  <li style={{ marginBottom: '8px' }}>One-click sign-in process</li>
                </ul>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', marginBottom: '12px' }}>How to Sign In:</h3>
                <ol style={{ marginLeft: '20px', counterReset: 'item' }}>
                  <li style={{ marginBottom: '8px' }}>Click the <span style={{ color: '#00D9FF', fontWeight: '600' }}>&quot;Sign In&quot;</span> button in the navigation</li>
                  <li style={{ marginBottom: '8px' }}>Authorize proclubs.io to access your Discord account</li>
                  <li style={{ marginBottom: '8px' }}>Grant permission to view connected accounts</li>
                  <li style={{ marginBottom: '8px' }}>You&apos;ll be redirected back to proclubs.io</li>
                  <li style={{ marginBottom: '8px' }}>Your profile is automatically created using your Discord info</li>
                </ol>
              </div>

              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', marginBottom: '12px' }}>What Permissions We Need:</h3>
                <div style={{ marginLeft: '20px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ color: '#10B981' }}>✓</span>
                    <span><code style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '13px' }}>identify</code> - Your Discord username and avatar</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ color: '#10B981' }}>✓</span>
                    <span><code style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '13px' }}>connections</code> - Your linked console accounts (PSN, Xbox, PC)</span>
                  </div>
                </div>
                <p style={{ fontSize: '14px', color: '#FBBF24', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span>⚠️</span>
                  <span>We NEVER access your messages, DMs, or private data</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Connecting Console to Discord */}
        <section style={{ marginBottom: '32px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(to right, #60A5FA, #00D9FF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                color: '#000'
              }}>
                3
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFFFFF' }}>Connecting Your Console to Discord</h2>
            </div>

            <div style={{ color: '#D1D5DB', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', marginBottom: '12px' }}>Why You Need This:</h3>
                <ul style={{ marginLeft: '20px' }}>
                  <li style={{ marginBottom: '8px' }}>Required to claim your player profile</li>
                  <li style={{ marginBottom: '8px' }}>Verifies you own the console account</li>
                  <li style={{ marginBottom: '8px' }}>Discord reads your linked PSN/Xbox/PC username</li>
                  <li style={{ marginBottom: '8px' }}>We match it to your EA player name</li>
                </ul>
              </div>

              {/* PlayStation */}
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                marginBottom: '16px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#60A5FA', marginBottom: '12px' }}>
                  🎮 For PlayStation (PSN)
                </h3>
                <ol style={{ marginLeft: '20px', marginBottom: '16px' }}>
                  <li style={{ marginBottom: '8px' }}>Open Discord (desktop or mobile app)</li>
                  <li style={{ marginBottom: '8px' }}>Go to User Settings (gear icon)</li>
                  <li style={{ marginBottom: '8px' }}>Click <span style={{ color: '#00D9FF', fontWeight: '600' }}>&quot;Connections&quot;</span> tab</li>
                  <li style={{ marginBottom: '8px' }}>Click the PlayStation Network icon</li>
                  <li style={{ marginBottom: '8px' }}>Sign in to your PSN account</li>
                  <li style={{ marginBottom: '8px' }}>Click &quot;Accept&quot; to authorize the connection</li>
                  <li style={{ marginBottom: '8px' }}>Your PSN ID will now show in Discord connections</li>
                </ol>
                <div style={{
                  background: 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  padding: '16px',
                  borderRadius: '6px'
                }}>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#FBBF24', marginBottom: '8px' }}>Important PSN Settings:</p>
                  <ul style={{ fontSize: '14px', marginLeft: '16px' }}>
                    <li style={{ marginBottom: '4px' }}>Go to your PS5/PS4 Settings</li>
                    <li style={{ marginBottom: '4px' }}>Navigate to: Settings → Account Management → Privacy Settings</li>
                    <li style={{ marginBottom: '4px' }}>Set &quot;Online Status&quot; to <span style={{ color: '#10B981' }}>&quot;Anyone&quot;</span></li>
                    <li style={{ marginBottom: '4px' }}>Set &quot;Now Playing&quot; to <span style={{ color: '#10B981' }}>&quot;Anyone&quot;</span></li>
                  </ul>
                </div>
              </div>

              {/* Xbox */}
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                marginBottom: '16px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#22C55E', marginBottom: '12px' }}>
                  🎮 For Xbox
                </h3>
                <ol style={{ marginLeft: '20px', marginBottom: '16px' }}>
                  <li style={{ marginBottom: '8px' }}>Open Discord (desktop or mobile app)</li>
                  <li style={{ marginBottom: '8px' }}>Go to User Settings (gear icon)</li>
                  <li style={{ marginBottom: '8px' }}>Click <span style={{ color: '#00D9FF', fontWeight: '600' }}>&quot;Connections&quot;</span> tab</li>
                  <li style={{ marginBottom: '8px' }}>Click the Xbox icon</li>
                  <li style={{ marginBottom: '8px' }}>Sign in with your Microsoft account</li>
                  <li style={{ marginBottom: '8px' }}>Authorize the connection</li>
                  <li style={{ marginBottom: '8px' }}>Your Xbox Gamertag will now show in Discord</li>
                </ol>
                <div style={{
                  background: 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  padding: '16px',
                  borderRadius: '6px'
                }}>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#FBBF24', marginBottom: '8px' }}>Important Xbox Settings:</p>
                  <ul style={{ fontSize: '14px', marginLeft: '16px' }}>
                    <li style={{ marginBottom: '4px' }}>Press Xbox button on controller</li>
                    <li style={{ marginBottom: '4px' }}>Go to Profile & system → Settings → Account</li>
                    <li style={{ marginBottom: '4px' }}>Navigate to Privacy & online safety → Xbox privacy</li>
                    <li style={{ marginBottom: '4px' }}>Set &quot;Others can see if you&apos;re online&quot; to <span style={{ color: '#10B981' }}>&quot;Everyone&quot;</span></li>
                  </ul>
                </div>
              </div>

              {/* PC */}
              <div style={{
                background: 'rgba(168, 85, 247, 0.1)',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid rgba(168, 85, 247, 0.3)'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#A855F7', marginBottom: '12px' }}>
                  💻 For PC (Origin/EA App)
                </h3>
                <ol style={{ marginLeft: '20px', marginBottom: '16px' }}>
                  <li style={{ marginBottom: '8px' }}>Open Discord</li>
                  <li style={{ marginBottom: '8px' }}>Go to User Settings → Connections</li>
                  <li style={{ marginBottom: '8px' }}>Look for EA/Origin connection option</li>
                  <li style={{ marginBottom: '8px' }}>Sign in to your EA account</li>
                  <li style={{ marginBottom: '8px' }}>Authorize the connection</li>
                </ol>
                <p style={{ fontSize: '14px', color: '#9CA3AF', fontStyle: 'italic' }}>
                  Note: PC connections may vary. If you don&apos;t see EA/Origin, your EA username should match your PC display name in-game.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: How to Claim Your Profile */}
        <section style={{ marginBottom: '32px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(to right, #60A5FA, #00D9FF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                color: '#000'
              }}>
                4
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFFFFF' }}>How to Claim Your Player Profile</h2>
            </div>

            <div style={{ color: '#D1D5DB', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', marginBottom: '12px' }}>Verification Process:</h3>
                <ul style={{ marginLeft: '20px' }}>
                  <li style={{ marginBottom: '8px' }}>After signing in, we check your Discord connections</li>
                  <li style={{ marginBottom: '8px' }}>We find your linked console usernames (PSN, Xbox, or PC)</li>
                  <li style={{ marginBottom: '8px' }}>We search EA&apos;s Pro Clubs API for players with those exact names</li>
                  <li style={{ marginBottom: '8px' }}>If your console username matches your EA player name exactly, you can claim!</li>
                </ul>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', marginBottom: '12px' }}>Claiming Steps:</h3>
                <ol style={{ marginLeft: '20px' }}>
                  <li style={{ marginBottom: '8px' }}>Sign in with Discord</li>
                  <li style={{ marginBottom: '8px' }}>Make sure your console is connected to Discord (see section above)</li>
                  <li style={{ marginBottom: '8px' }}>Search for your player profile on proclubs.io</li>
                  <li style={{ marginBottom: '8px' }}>If you see a <span style={{ color: '#00D9FF', fontWeight: '600' }}>&quot;Claim Profile&quot;</span> button, click it</li>
                  <li style={{ marginBottom: '8px' }}>Select which platform/console to claim from</li>
                  <li style={{ marginBottom: '8px' }}>We verify your Discord connection matches the player name</li>
                  <li style={{ marginBottom: '8px' }}>Success! Your profile is now claimed</li>
                </ol>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', marginBottom: '12px' }}>What You Can Do After Claiming:</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginLeft: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: '#10B981' }}>✓</span> Edit your bio</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: '#10B981' }}>✓</span> Add previous clubs</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: '#10B981' }}>✓</span> List trophies</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: '#10B981' }}>✓</span> Customize display</div>
                </div>
              </div>

              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                padding: '16px',
                borderRadius: '6px'
              }}>
                <p style={{ fontWeight: '600', color: '#60A5FA', marginBottom: '8px' }}>One Claim Per Platform:</p>
                <ul style={{ fontSize: '14px', marginLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}>You can claim one player per platform (PSN, Xbox, PC)</li>
                  <li style={{ marginBottom: '4px' }}>If you play on multiple platforms, you can claim up to 3 profiles total</li>
                  <li style={{ marginBottom: '4px' }}>Each platform requires a matching Discord connection</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Troubleshooting */}
        <section style={{ marginBottom: '32px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(to right, #60A5FA, #00D9FF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                color: '#000'
              }}>
                5
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFFFFF' }}>Troubleshooting</h2>
            </div>

            <div style={{ color: '#D1D5DB', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: '600', color: '#EF4444', marginBottom: '10px' }}>Can&apos;t Sign In:</h3>
                <ul style={{ marginLeft: '20px', fontSize: '14px' }}>
                  <li style={{ marginBottom: '6px' }}>Make sure you&apos;re using a desktop browser (not in-app browser)</li>
                  <li style={{ marginBottom: '6px' }}>Clear your browser cache and cookies</li>
                  <li style={{ marginBottom: '6px' }}>Try incognito/private browsing mode</li>
                  <li style={{ marginBottom: '6px' }}>Check Discord&apos;s status page for outages</li>
                </ul>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: '600', color: '#EF4444', marginBottom: '10px' }}>Console Not Showing:</h3>
                <ul style={{ marginLeft: '20px', fontSize: '14px' }}>
                  <li style={{ marginBottom: '6px' }}>Verify your console is actually connected in Discord Settings → Connections</li>
                  <li style={{ marginBottom: '6px' }}>Check privacy settings on your console (must be set to &quot;Anyone&quot; or &quot;Everyone&quot;)</li>
                  <li style={{ marginBottom: '6px' }}>Try disconnecting and reconnecting the account in Discord</li>
                  <li style={{ marginBottom: '6px' }}>Wait a few minutes for Discord to sync</li>
                </ul>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: '600', color: '#EF4444', marginBottom: '10px' }}>Can&apos;t Claim Profile:</h3>
                <ul style={{ marginLeft: '20px', fontSize: '14px' }}>
                  <li style={{ marginBottom: '6px' }}>Verify your console username exactly matches your EA player name (case-sensitive)</li>
                  <li style={{ marginBottom: '6px' }}>Make sure you&apos;re signed in with Discord</li>
                  <li style={{ marginBottom: '6px' }}>Check that your console connection is visible in Discord</li>
                  <li style={{ marginBottom: '6px' }}>Profile might already be claimed by another user</li>
                </ul>
              </div>

              <div style={{
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                padding: '16px',
                borderRadius: '6px'
              }}>
                <p style={{ fontWeight: '600', color: '#A855F7', marginBottom: '8px' }}>Still Having Issues?</p>
                <p style={{ fontSize: '14px', marginBottom: '12px' }}>Join our Discord for live support:</p>
                <a
                  href="https://discord.gg/qgtjykTCvY"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#00D9FF', textDecoration: 'underline', fontSize: '14px' }}
                >
                  https://discord.gg/qgtjykTCvY
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Important Notes */}
        <section style={{ marginBottom: '32px' }}>
          <div style={{
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#FBBF24' }}>⚠️ Important Notes</h2>
            <div style={{ color: '#D1D5DB', fontSize: '14px', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontWeight: '600', color: '#FFFFFF', marginBottom: '6px' }}>Username Matching:</p>
                <p style={{ marginBottom: '8px' }}>Your console username MUST exactly match your EA player name (case-sensitive). For example:</p>
                <ul style={{ marginLeft: '16px', marginTop: '8px' }}>
                  <li style={{ color: '#10B981', marginBottom: '4px' }}>✓ PSN: &quot;ProPlayer99&quot; = EA: &quot;ProPlayer99&quot;</li>
                  <li style={{ color: '#EF4444', marginBottom: '4px' }}>✗ PSN: &quot;ProPlayer99&quot; ≠ EA: &quot;proplayer99&quot;</li>
                </ul>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontWeight: '600', color: '#FFFFFF', marginBottom: '6px' }}>Privacy:</p>
                <ul style={{ marginLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}>We only access your Discord username and connected accounts</li>
                  <li style={{ marginBottom: '4px' }}>Your messages, DMs, and server list remain private</li>
                  <li style={{ marginBottom: '4px' }}>You can disconnect Discord anytime from User Settings</li>
                </ul>
              </div>

              <div>
                <p style={{ fontWeight: '600', color: '#FFFFFF', marginBottom: '6px' }}>Data Source:</p>
                <ul style={{ marginLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}>All stats come directly from EA&apos;s Pro Clubs API</li>
                  <li style={{ marginBottom: '4px' }}>Stats update in real-time when you play matches</li>
                  <li style={{ marginBottom: '4px' }}>We don&apos;t modify or store your match data</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Back to Home */}
        <div style={{ textAlign: 'center' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#FFFFFF',
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
          >
            <span>←</span>
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
