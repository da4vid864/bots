import { motion, Variants } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ScrollAnimationProps {
  children: ReactNode;
  variants?: Variants;
  className?: string;
  viewport?: {
    once?: boolean;
    amount?: number | 'some' | 'all';
    margin?: string;
  };
  /**
   * Predefined animation type
   * @default 'fadeIn'
   */
  animation?: 'fadeIn' | 'slideUp' | 'slideLeft' | 'slideRight' | 'scaleUp' | 'none';
  /**
   * Custom transition overrides
   */
  transition?: {
    duration?: number;
    delay?: number;
    ease?: string | number[];
  };
}

const defaultVariants: Record<string, Variants> = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  slideUp: {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  slideLeft: {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
  slideRight: {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  scaleUp: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  },
  none: {
    hidden: {},
    visible: {},
  },
};

const defaultTransition = {
  duration: 0.6,
  ease: [0.25, 0.1, 0.25, 1], // cubic-bezier
};

export function ScrollAnimation({
  children,
  variants,
  className,
  viewport = { once: true, amount: 0.2, margin: '-50px' },
  animation = 'fadeIn',
  transition,
}: ScrollAnimationProps) {
  const selectedVariants = variants || defaultVariants[animation];
  const mergedTransition = { ...defaultTransition, ...transition } as any;

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={selectedVariants}
      transition={mergedTransition}
      className={cn('will-change-transform', className)}
    >
      {children}
    </motion.div>
  );
}

// Example usage component for documentation
export function ScrollAnimationExample() {
  return (
    <div className="space-y-8 p-8">
      <ScrollAnimation animation="fadeIn">
        <div className="p-6 bg-primary-50 rounded-xl">
          <h3 className="text-2xl font-bold">Fade In Example</h3>
          <p>This section fades in when it enters the viewport.</p>
        </div>
      </ScrollAnimation>
      <ScrollAnimation animation="slideUp" transition={{ delay: 0.2 }}>
        <div className="p-6 bg-accent-50 rounded-xl">
          <h3 className="text-2xl font-bold">Slide Up Example</h3>
          <p>This section slides up with a slight delay.</p>
        </div>
      </ScrollAnimation>
    </div>
  );
}