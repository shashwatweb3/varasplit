'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCircle2, ExternalLink, RefreshCw } from 'lucide-react';
import { useState } from 'react';

import { useActionCenter } from '@/lib/actionCenter';
import { useWallet } from '@/lib/wallet';

const groups = ['Pending', 'Proof Ready'] as const;

function iconTone(type: string) {
  if (type.includes('proof') || type.includes('claim')) return 'bg-[#39d98a]/12 text-[#bcffe5]';
  return 'bg-[#7dffd4]/10 text-[#d8fff0]';
}

export function NotificationCenter() {
  const wallet = useWallet();
  const [open, setOpen] = useState(false);
  const {
    items: actionItems,
    unreadCount,
    loading,
    error,
    refresh,
    markRead,
    hasKnownRecords,
    hasCheckedKnownRecords,
    checkedRecordCount,
    scannedRecordCount,
  } = useActionCenter(wallet.selectedAccount);
  const itemCount = actionItems.length;
  const progressCopy = scannedRecordCount > 0
    ? `Loaded ${checkedRecordCount} of ${scannedRecordCount} recent records.`
    : 'Loading recent records from the contract.';
  const emptyTitle = loading
    ? 'Loading recent actions'
    : hasCheckedKnownRecords
      ? 'You’re all caught up'
      : hasKnownRecords
        ? 'Checking known records'
        : 'No known actions yet';
  const emptyCopy = loading
    ? progressCopy
    : hasCheckedKnownRecords
      ? 'No pending actions right now. Proof-ready records appear here automatically.'
      : hasKnownRecords
        ? 'Open one of your recent records again if this does not update.'
        : 'Open a group or payout to track it here. Your recent records will appear automatically once opened.';

  if (!wallet.isConnected) return null;

  return (
    <div className="relative">
      <motion.button
        type="button"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen((current) => !current)}
        className="relative grid h-11 w-11 place-items-center rounded-[18px] border border-[#70ffc4]/18 bg-[#142a1f]/60 text-[#d8fff0] shadow-[0_16px_44px_rgba(0,0,0,0.22)] transition hover:border-[#70ffc4]/42 hover:bg-[#69f5c7]/10"
        aria-label="Open pending actions"
      >
        <Bell className="h-5 w-5" />
        {itemCount > 0 ? (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#69f5c7] px-1 text-[10px] font-black text-[#03100b] shadow-[0_0_24px_rgba(105,245,199,0.45)]"
          >
            {itemCount}
          </motion.span>
        ) : null}
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(92vw,390px)] overflow-hidden rounded-[28px] border border-[#70ffc4]/18 bg-[#040807]/94 p-3 shadow-[0_28px_100px_rgba(0,0,0,0.55),0_0_54px_rgba(105,245,199,0.12)] backdrop-blur-2xl"
          >
            <div className="flex items-start justify-between gap-3 p-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#69f5c7]">Action center</p>
                <h3 className="mt-1 text-xl font-black text-[#ecfff7]">
                  {itemCount > 0 ? `${itemCount} record${itemCount === 1 ? '' : 's'} to review` : emptyTitle}
                </h3>
                {unreadCount > 0 ? <p className="mt-1 text-xs text-[rgba(236,255,247,0.6)]">{unreadCount} new since you last opened them</p> : null}
              </div>
              <button type="button" onClick={refresh} className="rounded-full border border-[#70ffc4]/16 p-2 text-[#bcffe5] transition hover:border-[#70ffc4]/36">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="max-h-[420px] space-y-3 overflow-auto p-2">
              {error ? (
                <div className="rounded-[22px] border border-[#ff7a7a]/20 bg-[#3a1010]/35 p-3 text-sm leading-6 text-[#ffd6d6]">
                  {error}
                </div>
              ) : null}

              {groups.map((group) => {
                const items = actionItems.filter((item) => item.group === group);
                if (!items.length) return null;

                return (
                  <div key={group}>
                    <p className="px-2 text-[10px] font-black uppercase tracking-[0.18em] text-[rgba(190,230,214,0.5)]">{group}</p>
                    <div className="mt-2 space-y-2">
                      {items.map((item) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => {
                            markRead(item.id);
                            setOpen(false);
                          }}
                          className={`group flex items-start gap-3 rounded-[20px] border p-3 transition hover:border-[#70ffc4]/30 hover:bg-[#69f5c7]/10 ${item.unread ? 'border-[#70ffc4]/22 bg-[#69f5c7]/10' : 'border-[#70ffc4]/12 bg-[#07110d]/72'}`}
                        >
                          <span className={`mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full ${iconTone(item.type)}`}>
                            {item.type.includes('proof') ? <CheckCircle2 className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2 text-sm font-bold text-[#ecfff7]">
                              {item.title}
                              {item.unread ? <span className="h-2 w-2 rounded-full bg-[#69f5c7] shadow-[0_0_14px_rgba(105,245,199,0.8)]" /> : null}
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-[rgba(236,255,247,0.68)]">{item.description}</span>
                          </span>
                          <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-[rgba(190,230,214,0.5)] transition group-hover:text-[#69f5c7]" />
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}

              {!actionItems.length && !error ? (
                <div className="rounded-[22px] border border-[#70ffc4]/12 bg-[#07110d]/72 p-4 text-sm leading-6 text-[rgba(236,255,247,0.72)]">
                  <span className="block text-base font-black text-[#ecfff7]">{emptyTitle}</span>
                  <span className="mt-1 block">{emptyCopy}</span>
                </div>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
