import type { Metadata } from "next";
import { Geist, Geist_Mono, Work_Sans, IBM_Plex_Mono, Montserrat, Teko } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navigation from "@/components/Navigation";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["500"],
});

const teko = Teko({
  variable: "--font-teko",
  subsets: ["latin"],
  weight: ["700"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://proclubs.io'),
  title: {
    default: "PROCLUBS.IO - EA Sports FC Pro Clubs Stats & Player Tracker",
    template: "%s | PROCLUBS.IO"
  },
  description: "Track EA Sports FC Pro Clubs statistics, player performance, club rankings, and match history. Search clubs and players, view detailed stats, and claim your profile. Real-time data from EA's official API.",
  keywords: [
    "EA FC Pro Clubs",
    "EA Sports FC",
    "Pro Clubs Stats",
    "EA FC Statistics",
    "Pro Clubs Tracker",
    "FC 25 Pro Clubs",
    "EA FC Player Stats",
    "Pro Clubs Leaderboard",
    "FIFA Pro Clubs",
    "Club Statistics",
    "Player Performance",
    "EA FC 25"
  ],
  authors: [{ name: "PROCLUBS.IO" }],
  creator: "PROCLUBS.IO",
  publisher: "PROCLUBS.IO",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://proclubs.io',
    siteName: 'PROCLUBS.IO',
    title: 'PROCLUBS.IO - EA Sports FC Pro Clubs Stats & Player Tracker',
    description: 'Track EA Sports FC Pro Clubs statistics, player performance, club rankings, and match history. Real-time data from EA\'s official API.',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PROCLUBS.IO - EA FC Pro Clubs Stats'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PROCLUBS.IO - EA Sports FC Pro Clubs Stats',
    description: 'Track EA Sports FC Pro Clubs statistics, player performance, and club rankings. Real-time data from EA\'s official API.',
    images: ['/images/og-image.png'],
    creator: '@proclubsio'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://proclubs.io',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${workSans.variable} ${ibmPlexMono.variable} ${montserrat.variable} ${teko.variable} antialiased`}
      >
        {/* Stadium Background - Global */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            height: "100vh",
            width: "100vw",
            backgroundImage: "url(/images/stadium-bg.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center top",
            backgroundRepeat: "no-repeat",
            backgroundColor: "#0A0A0A",
            zIndex: -1,
            pointerEvents: "none"
          }}
        />

        <Providers>
          <Navigation />
          <div style={{ position: "relative", zIndex: 2 }}>
            {children}
          </div>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
