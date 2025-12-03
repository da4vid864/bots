import { motion, useScroll } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface StickyCTAProps {
  /**
   * Text for the CTA button
   */
  ctaText?: string;
  /**
   * Callback when CTA is clicked
   */
  onCtaClick?: () => void;
  /**
   * Whether to show the CTA only on mobile (default true)
   */
  mobileOnly?: boolean;
  /**
   * Offset from bottom (in pixels)
   */
  bottomOffset?: number;
  /**
   * Show after scrolling this many pixels
   */
  showAfterScroll?: number;
  /**
   * Additional class names
   */
  className?: string;
}

export function StickyCTA({
  ctaText = 'Start Free Trial',
  onCtaClick,
  mobileOnly = true,
  bottomOffset = 20,
  showAfterScroll = 300,
  className,
}: StickyCTAProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { scrollY } = useScroll();

  // Determine if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show/hide based on scroll
  useEffect(() => {
    const unsubscribe = scrollY.on('change', (y: number) => {
      const shouldShow = y > showAfterScroll;
      setIsVisible(shouldShow);
    });
    return () => unsubscribe();
  }, [scrollY, showAfterScroll]);

  // If mobileOnly and not mobile, don't render
  if (mobileOnly && !isMobile) {
    return null;
  }

  return (
    <motion.div
      className={cn(
        'fixed left-0 right-0 z-50 flex justify-center px-4',
        className
      )}
      style={{
        bottom: bottomOffset,
        y: isVisible ? 0 : 100,
        opacity: isVisible ? 1 : 0,
      }}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: isVisible ? 0 : 100, opacity: isVisible ? 1 : 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      <div className="w-full max-w-md">
        <Button
          size="lg"
          variant="primary"
          className="w-full shadow-2xl py-4 text-lg"
          onClick={onCtaClick}
        >
          {ctaText}
        </Button>
      </div>
    </motion.div>
  );
}