import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Treasury Intelligence Platform",
  description: "AI-powered daily intelligence for corporate Treasury executives",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-navy-950 text-slate-200 antialiased">
        {children}
      </body>
    </html>
  );
}
