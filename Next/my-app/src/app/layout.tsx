import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";



export default function RootLayout({
  children,
  team,
  analytics,
}: Readonly<{
  children: React.ReactNode;
  team: React.ReactNode;
  analytics: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
      >
        {children}
        {team}
        {analytics}
        <Link href="/setting">Setting</Link>
      </body>
    </html>
  );
}
