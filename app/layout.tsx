import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://projectzeta9.com"),
  title: {
    default: "ProjectZeta9 | Milestone & Deadline Control for Startup Engineering Teams",
    template: "%s | ProjectZeta9",
  },
  description:
    "ProjectZeta9 unifies GitHub, Linear, and Notion signals into one project health dashboard so engineering managers catch blockers early and stop deadline drift.",
  keywords: [
    "project tracking software",
    "engineering deadline management",
    "milestone alerts",
    "startup project visibility",
    "GitHub Linear Notion integrations",
  ],
  openGraph: {
    title: "ProjectZeta9",
    description:
      "Stop project drift before it burns sprint time. Track milestone risk and receive actionable alerts.",
    url: "https://projectzeta9.com",
    siteName: "ProjectZeta9",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ProjectZeta9 dashboard preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ProjectZeta9",
    description:
      "Automated milestone tracking and deadline alerts for software teams.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0d1117] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
