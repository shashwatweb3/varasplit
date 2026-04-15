'use client';

import { useWallet } from '@/lib/wallet';

export function ConnectGuard({ children }: { children: React.ReactNode }) {
  const wallet = useWallet();

  if (!wallet.isConnected) {
    return (
      <div className="rounded-[22px] border border-[#70ffc4]/18 bg-[#142a1f]/50 px-4 py-3 text-sm font-medium text-[rgba(236,255,247,0.76)]">
        Connect your wallet first. VaraSplit only asks you to sign when you create or close a record.
      </div>
    );
  }

  return <>{children}</>;
}
