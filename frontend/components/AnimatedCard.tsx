'use client';

import { motion } from 'framer-motion';

type Props = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  soft?: boolean;
};

export function AnimatedCard({ children, className = '', delay = 0, soft = false }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`${soft ? 'soft-card' : 'glass-card'} transition-shadow duration-300 hover:shadow-[0_28px_90px_rgba(0,0,0,0.38),0_0_54px_rgba(105,245,199,0.1)] ${className}`}
    >
      {children}
    </motion.div>
  );
}
