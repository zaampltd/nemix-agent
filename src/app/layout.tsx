import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nemix Agent Command Center",
  description: "Autonomous multi-agent orchestration console powered by Nemix LLM Gateway",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
