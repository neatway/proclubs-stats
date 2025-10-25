import type { Metadata } from "next";
import { Geist, Geist_Mono, Work_Sans, IBM_Plex_Mono, Montserrat, Teko } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navigation from "@/components/Navigation";

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
  title: "PROCLUBS.IO - EA FC Pro Clubs Stats",
  description: "EA Sports FC Pro Clubs statistics and player tracking",
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
      </body>
    </html>
  );
}
