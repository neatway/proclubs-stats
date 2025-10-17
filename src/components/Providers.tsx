"use client";
import { SessionProvider } from "next-auth/react";
import NavigationClient from "./NavigationClient";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NavigationClient />
      {children}
    </SessionProvider>
  );
}
