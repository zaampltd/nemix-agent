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
  title: "Nvmix — Agent Workspace",
  description: "Manage your AI agents, projects, and team communications in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('nvmix_theme');
                  if (saved === 'light') {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
        {/* Load FontAwesome v6 for identical visual fidelity matching user mockup */}
        <link 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" 
          rel="stylesheet" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer"
        />
        {/* Light mode color visibility overrides — fixes emerald/green on white backgrounds */}
        <style dangerouslySetInnerHTML={{ __html: `
          /* ── Green / Emerald ── */
          .light .text-emerald-400 { color: #15803d !important; }
          .light .text-emerald-500 { color: #15803d !important; }
          .light .text-emerald-600 { color: #166534 !important; }
          .light .bg-emerald-400   { background-color: #16a34a !important; }
          .light .bg-emerald-500   { background-color: #16a34a !important; }
          .light .border-emerald-500\\/20 { border-color: rgba(22,163,74,0.30) !important; }
          .light .border-emerald-500\\/25 { border-color: rgba(22,163,74,0.35) !important; }
          .light .bg-emerald-500\\/10     { background-color: rgba(22,163,74,0.10) !important; }
          .light .bg-emerald-900\\/40     { background-color: rgba(22,163,74,0.12) !important; }
          /* ── Amber ── */
          .light .text-amber-400   { color: #b45309 !important; }
          .light .text-amber-500   { color: #92400e !important; }
          .light .bg-amber-400     { background-color: #d97706 !important; }
          .light .bg-amber-500\\/10 { background-color: rgba(180,120,0,0.10) !important; }
          /* ── Violet / Purple ── */
          .light .text-violet-400  { color: #6d28d9 !important; }
          .light .text-violet-500  { color: #5b21b6 !important; }
          .light .bg-violet-400    { background-color: #7c3aed !important; }
        ` }} />
      </head>

      <body className="antialiased bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen">
        {children}
      </body>
    </html>
  );
}
