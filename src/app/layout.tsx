import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Treasury Intelligence Platform",
  description: "AI-powered daily intelligence for corporate Treasury executives",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply saved theme before first paint — prevents flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('tip-theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-screen bg-white dark:bg-navy-950 text-gray-900 dark:text-slate-200 antialiased">
        {children}
      </body>
    </html>
  );
}
