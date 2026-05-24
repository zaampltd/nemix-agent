import type { Metadata } from "next";
import { Inter, Outfit, Fira_Code } from 'next/font/google';
import "./globals.css";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-fira-code',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Nemix Agent Orchestrator Swarm",
  description: "Autonomous Paperclip-style multi-agent simulation console powered by Nemix LLM Gateway",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${firaCode.variable} dark`}>
      <body className="antialiased bg-[#050507] text-[#f3f3f7] min-h-screen">
        {children}
      </body>
    </html>
  );
}
