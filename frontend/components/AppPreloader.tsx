'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const PRELOADER_KEY = 'varasplit.preloader-seen';
const words = ['VARASPLIT', 'वारा स्प्लिट', 'ヴァラスプリット', '바라스플릿', 'ВараСплит', 'فارا سبلِت', '瓦拉分账', 'वारा विभाजन', 'VaraSplit'];

export function AppPreloader() {
  const [visible, setVisible] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.sessionStorage.getItem(PRELOADER_KEY)) return;

    const showTimer = window.setTimeout(() => setVisible(true), 0);
    const wordTimer = window.setInterval(() => {
      setWordIndex((current) => (current + 1) % words.length);
    }, 145);
    const exitTimer = window.setTimeout(() => {
      window.sessionStorage.setItem(PRELOADER_KEY, 'true');
      setVisible(false);
    }, 1250);

    return () => {
      window.clearTimeout(showTimer);
      window.clearInterval(wordTimer);
      window.clearTimeout(exitTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-[#040807]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: '-12%', borderBottomLeftRadius: '48%', borderBottomRightRadius: '48%' }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="absolute h-[34rem] w-[34rem] rounded-full bg-[#69f5c7]/12 blur-3xl"
            animate={{ scale: [0.92, 1.12, 0.96], opacity: [0.25, 0.5, 0.28] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <div className="relative text-center">
            <motion.p
              key={wordIndex}
              initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(10px)' }}
              className="text-4xl font-black tracking-[-0.04em] text-[#ecfff7] sm:text-6xl"
            >
              {words[wordIndex]}
            </motion.p>
            <div className="mx-auto mt-6 h-1 w-44 overflow-hidden rounded-full bg-[#142a1f]">
              <motion.div
                className="h-full rounded-full bg-[#69f5c7] shadow-[0_0_28px_rgba(105,245,199,0.7)]"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.15, ease: 'easeInOut' }}
              />
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
