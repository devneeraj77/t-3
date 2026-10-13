import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LibraryOS — Modern Personal Library',
  description: 'Full-stack Personal Library built with Next.js App Router and TypeScript',
  icons: {
    icon: 'https://cdn.freecodecamp.org/universal/favicons/favicon-16x16.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        <div className="ambient-glow ambient-glow-1"></div>
        <div className="ambient-glow ambient-glow-2"></div>
        {children}
      </body>
    </html>
  );
}
