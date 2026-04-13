'use client';

import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect } from 'react';

interface AnimatedNumberProps {
  value: bigint;
  prefix?: string;
}

export function AnimatedNumber({ value, prefix = '' }: AnimatedNumberProps) {
  const numericValue = Number(value);
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (latest) => `${prefix}${latest.toFixed(0)}`);

  useEffect(() => {
    const controls = animate(motionValue, numericValue, {
      duration: 0.5,
      ease: 'easeOut',
    });

    return () => controls.stop();
  }, [motionValue, numericValue]);

  return <motion.span>{display}</motion.span>;
}
