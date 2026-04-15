'use client';

import { NotificationCenter } from './NotificationCenter';
import { WalletButton } from './WalletButton';

export function HeaderActions() {
  return (
    <div className="flex items-center gap-2">
      <NotificationCenter />
      <WalletButton />
    </div>
  );
}
