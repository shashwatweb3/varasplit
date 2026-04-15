import type { Metadata } from 'next';

import { AppPreloader } from '@/components/AppPreloader';

import './globals.css';

export const metadata: Metadata = {
  title: 'VaraSplit | Split and payout proofs',
  description: 'Split shared costs, pay work, claim funds, and share verified records on Vara.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppPreloader />
        {children}
      </body>
    </html>
  );
}
