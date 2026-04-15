'use client';

import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

const section: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.06 } },
};

type Props = {
  children: React.ReactNode;
  className?: string;
  as?: 'section' | 'div';
};

export function MotionSection({ children, className = '', as = 'section' }: Props) {
  const Component = as === 'div' ? motion.div : motion.section;

  return (
    <Component
      variants={section}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      className={className}
    >
      {children}
    </Component>
  );
}
