import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Nvmix Swarm Command Center",
  description: "Autonomous multi-agent simulation console powered by Nvmix LLM Gateway",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} dark`}>
      <head>
        {/* Load FontAwesome v6 for identical visual fidelity matching user mockup */}
        <link 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" 
          rel="stylesheet" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="antialiased bg-nvmixBg text-[#f8fafc] min-h-screen">
        {children}
      </body>
    </html>
  );
}
