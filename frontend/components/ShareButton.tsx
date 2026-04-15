'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Copy, Share2 } from 'lucide-react';

type ShareState = 'idle' | 'copied' | 'error';

type Props = {
  title?: string;
  text?: string;
  className?: string;
};

export function ShareButton({ title = 'VaraSplit record', text = 'Permanent on-chain proof from VaraSplit.', className = '' }: Props) {
  const [state, setState] = useState<ShareState>('idle');

  useEffect(() => {
    if (state === 'idle') return;
    const timer = window.setTimeout(() => setState('idle'), 2600);
    return () => window.clearTimeout(timer);
  }, [state]);

  async function copyUrl(url: string) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  async function share() {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        setState('copied');
        return;
      }

      await copyUrl(url);
      setState('copied');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;

      try {
        await copyUrl(url);
        setState('copied');
      } catch {
        setState('error');
      }
    }
  }

  return (
    <div className={`relative ${className}`}>
      <motion.button
        type="button"
        whileHover={{ y: -2, scale: 1.01 }}
        whileTap={{ scale: 0.97 }}
        onClick={share}
        className="secondary-button w-full sm:w-auto"
      >
        {state === 'copied' ? <CheckCircle2 className="h-4 w-4" /> : state === 'error' ? <Copy className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
        {state === 'copied' ? 'Record link copied' : state === 'error' ? 'Copy failed' : 'Share Record'}
      </motion.button>
      {state === 'copied' ? (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          className="absolute left-1/2 top-[calc(100%+0.5rem)] z-20 w-max -translate-x-1/2 rounded-full border border-[#70ffc4]/22 bg-[#07110d]/95 px-3 py-2 text-xs font-bold text-[#d8fff0] shadow-[0_0_34px_rgba(105,245,199,0.16)]"
        >
          Ready to share
        </motion.div>
      ) : null}
    </div>
  );
}
