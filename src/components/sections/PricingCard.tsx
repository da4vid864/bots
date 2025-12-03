import { CheckIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface PricingCardProps {
  planName: string;
  price: {
    monthly: number;
    annual: number;
  };
  billingPeriod: 'monthly' | 'annual';
  description: string;
  features: {
    text: string;
    included: boolean;
  }[];
  highlighted?: boolean;
  ctaText?: string;
  onCtaClick?: () => void;
}

export function PricingCard({
  planName,
  price,
  billingPeriod,
  description,
  features,
  highlighted = false,
  ctaText = 'Start Free Trial',
  onCtaClick,
}: PricingCardProps) {
  const displayPrice = billingPeriod === 'monthly' ? price.monthly : price.annual;
  const isAnnual = billingPeriod === 'annual';
  const savings = isAnnual ? Math.round((1 - price.annual / price.monthly) * 100) : 0;

  return (
    <div
      className={cn(
        'relative flex flex-col p-8 rounded-2xl border-2 bg-white dark:bg-secondary-900 transition-all duration-300',
        highlighted
          ? 'border-primary-500 shadow-2xl scale-105'
          : 'border-secondary-200 dark:border-secondary-700 shadow-lg hover:shadow-xl'
      )}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-sm font-semibold py-1 px-4 rounded-full">
          Most Popular
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-2xl font-bold text-secondary-800 dark:text-secondary-100">
          {planName}
        </h3>
        <p className="text-secondary-600 dark:text-secondary-300 mt-2">{description}</p>
      </div>

      <div className="mb-8">
        <div className="flex items-baseline">
          <span className="text-5xl font-bold text-secondary-900 dark:text-white">
            ${displayPrice}
          </span>
          <span className="text-secondary-600 dark:text-secondary-300 ml-2">/month</span>
        </div>
        {isAnnual && savings > 0 && (
          <p className="text-sm text-accent-600 dark:text-accent-400 mt-2">
            Save {savings}% compared to monthly billing
          </p>
        )}
        {!isAnnual && price.annual < price.monthly * 12 && (
          <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-2">
            Annual billing available (save up to {Math.round((1 - price.annual / (price.monthly * 12)) * 100)}%)
          </p>
        )}
      </div>

      <ul className="space-y-4 flex-grow">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start">
            {feature.included ? (
              <CheckIcon className="w-5 h-5 text-accent-500 mr-3 flex-shrink-0 mt-0.5" />
            ) : (
              <XIcon className="w-5 h-5 text-secondary-400 mr-3 flex-shrink-0 mt-0.5" />
            )}
            <span
              className={cn(
                'text-secondary-700 dark:text-secondary-300',
                !feature.included && 'opacity-60'
              )}
            >
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-10">
        <Button
          variant={highlighted ? 'primary' : 'outline'}
          size="lg"
          className="w-full"
          onClick={onCtaClick}
        >
          {ctaText}
        </Button>
      </div>
    </div>
  );
}