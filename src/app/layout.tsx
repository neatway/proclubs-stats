import type { Metadata } from "next";
import { Geist, Geist_Mono, Work_Sans, IBM_Plex_Mono, Montserrat } from "next/font/google";
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
        className={`${geistSans.variable} ${geistMono.variable} ${workSans.variable} ${ibmPlexMono.variable} ${montserrat.variable} antialiased`}
      >
        <Providers>
          <Navigation />
          {children}
        </Providers>
      </body>
    </html>
  );
}
