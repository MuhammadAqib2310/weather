import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zeeshu Weather Alert — Real-time Global Weather",
  description:
    "Premium real-time weather, radar, AQI, lightning detection, and severe weather alert dashboard for worldwide cities.",
  manifest: "/manifest.json",
  keywords: ["weather", "alerts", "radar", "AQI", "lightning", "forecast", "Pakistan"],
  authors: [{ name: "Zeeshu Weather" }],
  openGraph: {
    title: "Zeeshu Weather Alert",
    description: "Premium real-time weather and severe alert platform.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#061225",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
