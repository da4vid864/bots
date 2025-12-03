import { motion, MotionProps } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface AnimatedIconProps extends MotionProps {
  icon: LucideIcon;
  size?: number;
  className?: string;
  /**
   * Animation type
   * @default 'bounce'
   */
  animation?: 'bounce' | 'pulse' | 'rotate' | 'fill' | 'scale';
  /**
   * Color of the icon (default currentColor)
   */
  color?: string;
  /**
   * Hover color (if fill animation)
   */
  hoverColor?: string;
  /**
   * Whether to animate on hover only
   * @default true
   */
  animateOnHover?: boolean;
}

export function AnimatedIcon({
  icon: Icon,
  size = 24,
  className,
  animation = 'bounce',
  color,
  hoverColor,
  animateOnHover = true,
  ...motionProps
}: AnimatedIconProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const animationVariants = {
    bounce: {
      scale: isHovered ? [1, 1.2, 1] : 1,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
    pulse: {
      scale: isHovered ? [1, 1.1, 1] : 1,
      opacity: isHovered ? [1, 0.8, 1] : 1,
      transition: { duration: 0.6 },
    },
    rotate: {
      rotate: isHovered ? 360 : 0,
      transition: { duration: 0.6, ease: 'easeInOut' },
    },
    fill: {
      color: isHovered ? hoverColor : color,
      transition: { duration: 0.3 },
    },
    scale: {
      scale: isHovered ? 1.15 : 1,
      transition: { duration: 0.2 },
    },
  } as any;

  const selectedVariant = animationVariants[animation];

  const motionComponent = (
    <motion.div
      onMouseEnter={animateOnHover ? handleMouseEnter : undefined}
      onMouseLeave={animateOnHover ? handleMouseLeave : undefined}
      animate={selectedVariant}
      className={cn('inline-flex', className)}
      {...motionProps}
    >
      <Icon size={size} color={isHovered && hoverColor ? hoverColor : color} />
    </motion.div>
  );

  return motionComponent;
}

// Example usage component
export function AnimatedIconExample() {
  // This would require actual Lucide icons imported
  // import { Zap, CheckCircle, Settings } from 'lucide-react';
  return (
    <div className="flex gap-8 p-8">
      <p className="text-sm text-secondary-600">Example requires lucide-react icons.</p>
      {/* <AnimatedIcon icon={Zap} animation="bounce" />
      <AnimatedIcon icon={CheckCircle} animation="pulse" />
      <AnimatedIcon icon={Settings} animation="rotate" /> */}
    </div>
  );
}