'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

import { configError } from '@/lib/config';
import { getAdapter } from '@/lib/adapter';
import { saveRecentGroup, loadRecentGroups, type RecentGroup } from '@/lib/storage';
import type { GroupView } from '@/lib/types';
import { connectWalletAccount, disconnectWalletAccount } from '@/lib/wallet';

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

export default function HomePage() {
  const router = useRouter();
  const warning = useMemo(() => configError(), []);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [recentGroups, setRecentGroups] = useState<RecentGroup[]>([]);
  const [groups, setGroups] = useState<GroupView[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [message, setMessage] = useState<string | null>(warning);

  const isSettledGroup = (group: GroupView) =>
    group.balances.every((balance) => balance.balance === BigInt(0));

  const activeGroups = useMemo(
    () => groups.filter((group) => !isSettledGroup(group)),
    [groups],
  );

  const settledGroups = useMemo(
    () => groups.filter(isSettledGroup),
    [groups],
  );

  useEffect(() => {
    const storedGroups = loadRecentGroups();
    setRecentGroups(storedGroups);

    if (!storedGroups.length) {
      return;
    }

    const adapter = getAdapter();
    (async () => {
      try {
        const loadedGroups = await Promise.all(
          storedGroups.map(async (group) => {
            try {
              const remoteGroup = await adapter.getGroup(group.id);
              saveRecentGroup(remoteGroup.id, remoteGroup.name);
              return remoteGroup;
            } catch {
              return {
                id: group.id,
                name: group.name,
                members: [],
                balances: [],
                expenses: [],
              };
            }
          }),
        );

        setGroups(loadedGroups);
        setRecentGroups(loadedGroups.map(({ id, name }) => ({ id, name })));
      } catch {
        // Keep fallback names when contract lookup is unavailable.
      }
    })();
  }, []);

  async function handleConnect() {
    setIsConnecting(true);
    setMessage(null);

    try {
      const account = await connectWalletAccount();
      setConnectedAddress(account.address);
      router.push('/create');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to connect wallet.');
    } finally {
      setIsConnecting(false);
    }
  }

  function handleDisconnect() {
    disconnectWalletAccount();
    setConnectedAddress(null);
    setMessage('Wallet disconnected.');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 pb-12 pt-6 sm:px-6">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0b1220] p-6 shadow-lg hover:scale-105 transition-transform duration-300 hover:shadow-[0_0_20px_rgba(74,222,128,0.2)] sm:p-10"
      >
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,_rgba(123,240,186,0.24),_transparent_60%)]" />
        <p className="relative text-sm uppercase tracking-[0.34em] text-slate-400">VaraSplit</p>
        <h1 className="relative mt-4 max-w-xl text-5xl font-bold tracking-tight bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent sm:text-7xl">
          Managing money—together
        </h1>
        <p className="relative mt-5 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
          Connect wallet to start splitting, create a group in seconds, and settle the whole ledger in one clear tap.
        </p>

        <div className="relative mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleConnect}
            disabled={isConnecting}
            className="rounded-full bg-green-400 px-6 py-4 text-center text-base font-semibold text-black hover:shadow-[0_0_20px_rgba(74,222,128,0.5)] transition-shadow"
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
          {connectedAddress ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href={recentGroups.length ? `/group/${recentGroups[0].id}` : '/create'}>
                <button className="rounded-full border border-green-400 bg-transparent px-6 py-4 text-center text-base font-semibold text-green-400 hover:shadow-[0_0_20px_rgba(74,222,128,0.5)] transition-shadow">
                  Resume where you left off
                </button>
              </Link>
              <button
                type="button"
                onClick={handleDisconnect}
                className="rounded-full border border-green-400 bg-transparent px-6 py-4 text-center text-base font-semibold text-green-400 hover:shadow-[0_0_20px_rgba(74,222,128,0.5)] transition-shadow"
              >
                Disconnect
              </button>
            </div>
          ) : null}
        </div>

        {connectedAddress ? (
          <div className="relative mt-4 inline-flex rounded-full border border-white/5 bg-[#0b1220] px-4 py-2 text-sm text-slate-400">
            Connected wallet: {shortAddress(connectedAddress)}
          </div>
        ) : null}
      </motion.section>

      {message ? (
        <div className="mt-4 rounded-2xl border border-amber-300/30 bg-[#0b1220] px-4 py-3 text-sm text-amber-100">
          {message}
        </div>
      ) : null}

      <section id="how" className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          ['Create', 'Name the group, paste wallet addresses, move on.'],
          ['Add', 'Pick payer, amount, and description. VaraSplit calculates the rest.'],
          ['Settle', 'One button generates the cleanest payoff path and share card.'],
        ].map(([title, body], index) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="rounded-2xl border border-white/5 bg-[#0b1220] p-5 shadow-lg hover:scale-105 transition-transform duration-300 hover:shadow-[0_0_20px_rgba(74,222,128,0.2)]"
          >
            <p className="text-sm uppercase tracking-[0.28em] text-slate-400">0{index + 1}</p>
            <h2 className="mt-3 text-2xl font-semibold text-gray-200">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">{body}</p>
          </motion.div>
        ))}
      </section>

      {groups.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-white/5 bg-[#0b1220] p-6 shadow-lg">
          <p className="text-sm text-slate-400">No groups yet</p>
        </section>
      ) : (
        <>
          <section className="mt-8 rounded-2xl border border-white/5 bg-[#0b1220] p-6 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Active Groups</p>
                <h2 className="mt-2 text-2xl font-semibold text-gray-200">Pending balances</h2>
              </div>
            </div>

            {activeGroups.length ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {activeGroups.map((group, index) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={`/group/${group.id}`}
                      className="block rounded-2xl border border-white/5 bg-[#0b1220] px-5 py-4 transition hover:border-green-400/40 hover:bg-[#0b1220] hover:scale-105 hover:shadow-[0_0_20px_rgba(74,222,128,0.2)]"
                    >
                      <p className="text-lg font-semibold text-gray-200">{group.name}</p>
                      <p className="mt-1 text-sm text-slate-400">Open group #{group.id}</p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-white/5 bg-[#0b1220] px-5 py-6 text-sm text-slate-400">
                No active groups yet
              </div>
            )}
          </section>

          <section className="mt-6 rounded-2xl border border-white/5 bg-[#0b1220] p-6 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Settled Groups</p>
                <h2 className="mt-2 text-2xl font-semibold text-gray-200">Fully settled</h2>
              </div>
            </div>

            {settledGroups.length ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {settledGroups.map((group, index) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={`/group/${group.id}`}
                      className="block rounded-2xl border border-white/5 bg-[#0b1220] px-5 py-4 transition hover:border-green-400/40 hover:bg-[#0b1220] hover:scale-105 hover:shadow-[0_0_20px_rgba(74,222,128,0.2)]"
                    >
                      <p className="text-lg font-semibold text-gray-200">{group.name}</p>
                      <p className="mt-1 text-sm text-slate-400">Open group #{group.id}</p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-white/5 bg-[#0b1220] px-5 py-6 text-sm text-slate-400">
                No settled groups yet
              </div>
            )}
          </section>
        </>
      )}

    </main>
  );
}
