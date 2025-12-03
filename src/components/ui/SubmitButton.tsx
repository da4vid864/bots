import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface SubmitButtonProps extends Omit<ButtonProps, 'children'> {
  /**
   * Whether the form is submitting
   */
  loading?: boolean;
  /**
   * Whether the submission was successful
   */
  success?: boolean;
  /**
   * Text to show when idle
   */
  idleText?: string;
  /**
   * Text to show while loading
   */
  loadingText?: string;
  /**
   * Text to show on success
   */
  successText?: string;
  /**
   * Icon size
   */
  iconSize?: number;
}

export function SubmitButton({
  loading = false,
  success = false,
  idleText = 'Submit',
  loadingText = 'Submitting...',
  successText = 'Success!',
  iconSize = 20,
  className,
  disabled,
  ...buttonProps
}: SubmitButtonProps) {
  const isDisabled = disabled || loading || success;

  return (
    <Button
      className={cn('relative overflow-hidden', className)}
      disabled={isDisabled}
      {...buttonProps}
    >
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center gap-2"
          >
            <CheckCircle size={iconSize} />
            <span>{successText}</span>
          </motion.div>
        ) : loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center gap-2"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 size={iconSize} />
            </motion.div>
            <span>{loadingText}</span>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center"
          >
            {idleText}
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
}