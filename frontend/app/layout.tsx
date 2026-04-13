import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'VaraSplit',
  description: 'Create a group, add expenses, and settle everything in one clean flow on Vara.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
