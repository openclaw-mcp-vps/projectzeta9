import type { Metadata } from "next";
import { Space_Grotesk, Geist } from "next/font/google";
import Script from "next/script";

import "@/app/globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://projectzeta9.com"),
  title: {
    default: "ProjectZeta9 | Smart Milestone Tracking for Software Teams",
    template: "%s | ProjectZeta9"
  },
  description:
    "ProjectZeta9 unifies GitHub, Linear, and Notion signals to predict project drift early, cut status-update overhead, and keep engineering timelines on track.",
  openGraph: {
    title: "ProjectZeta9",
    description:
      "Automate milestone tracking and deadline risk analysis. Surface blockers before they derail your roadmap.",
    type: "website",
    url: "https://projectzeta9.com"
  },
  twitter: {
    card: "summary_large_image",
    title: "ProjectZeta9",
    description:
      "Deadline risk alerts and unified project health for startup engineering teams managing 3-8 concurrent initiatives."
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", spaceGrotesk.variable, "font-sans", geist.variable)}>
      <body className="bg-[#0d1117] font-[family-name:var(--font-space-grotesk)] text-[#f8fafc] antialiased">
        <Script src="https://app.lemonsqueezy.com/js/lemon.js" strategy="afterInteractive" />
        {children}
      </body>
    </html>
  );
}
