'use client';

import { motion } from 'framer-motion';

export function AnimatedHeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[32px]">
      <motion.div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            'linear-gradient(rgba(125,255,212,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(125,255,212,0.045) 1px, transparent 1px)',
          backgroundSize: '46px 46px',
        }}
        animate={{ backgroundPosition: ['0px 0px', '46px 46px'] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#69f5c7]/18 blur-3xl"
        animate={{ x: [0, 50, 12], y: [0, 18, -8], scale: [1, 1.12, 0.96] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-28 right-0 h-80 w-80 rounded-full bg-[#39d98a]/14 blur-3xl"
        animate={{ x: [0, -36, 0], y: [0, -20, 0], scale: [0.96, 1.08, 0.96] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      {Array.from({ length: 16 }).map((_, index) => (
        <motion.span
          key={index}
          className="absolute h-1 w-1 rounded-full bg-[#d8fff0]/55 shadow-[0_0_12px_rgba(105,245,199,0.75)]"
          style={{
            left: `${8 + ((index * 19) % 84)}%`,
            top: `${10 + ((index * 31) % 70)}%`,
          }}
          animate={{ opacity: [0.25, 0.8, 0.25], y: [0, -8, 0] }}
          transition={{ duration: 3 + (index % 5), repeat: Infinity, delay: index * 0.13 }}
        />
      ))}
    </div>
  );
}
