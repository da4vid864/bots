# WhatsAuto Landing Page – Component Architecture & Implementation

## 1. Project Folder Structure (`src/`)

```
src/
├── components/
│   ├── layout/           # Header, Footer, Container
│   ├── sections/         # Hero, Features, Pricing, etc.
│   ├── ui/               # Button, Card, Accordion, Badge
│   └── shared/           # Icons, Logos
├── lib/                  # hooks, utils, context
├── pages/                # Next.js pages (or app/ for App Router)
├── styles/               # Global CSS, Tailwind imports
└── public/               # Static assets
```

### Purpose of Each Folder

- **`components/layout/`**: Contains layout components that define the overall page structure (e.g., `Header`, `Footer`, `Container`). These are reused across all pages.
- **`components/sections/`**: Each landing page section is implemented as a standalone component (e.g., `Hero`, `Features`, `Pricing`, `Testimonials`). This promotes modularity and easy A/B testing.
- **`components/ui/`**: Reusable UI primitives with built‑in variants (Button, Card, Accordion, Badge). These follow the design system and are built with `cva` or `clsx` for variant management.
- **`components/shared/`**: Shared assets like SVG icons, logos, and illustration components.
- **`lib/`**: Custom React hooks, utility functions (e.g., `cn` for class merging), and context providers (theme, auth).
- **`pages/`** (or `app/`): Next.js page components. Using the App Router is recommended for better performance and SEO.
- **`styles/`**: Global CSS and Tailwind directives.
- **`public/`**: Images, fonts, and other static files.

## 2. Recommended Libraries

| Library | Version | Justification |
|---------|---------|---------------|
| Next.js | ^14.2.0 | SSR/SEO, excellent performance, built‑in image optimization, and App Router support. |
| React | ^18.2.0 | UI library with concurrent features. |
| Tailwind CSS | ^4.0.0 | Utility‑first CSS framework that aligns perfectly with the design‑system token approach. |
| `class‑variance‑authority` (cva) | ^0.7.0 | Type‑safe variant management for UI components. |
| `clsx` | ^2.0.0 | Conditional class merging, used together with cva. |
| `framer‑motion` | ^11.0.0 | Smooth animations and micro‑interactions to enhance user engagement. |
| `@headlessui/react` | ^2.0.0 | Unstyled, accessible UI components (dropdowns, modals, tabs). |
| `swiper` | ^11.0.0 | Touch‑friendly carousel for testimonials and feature showcases. |
| `react‑hook‑form` | ^7.0.0 | Performant form handling with minimal re‑renders. |
| `zod` | ^3.22.0 | Schema validation for forms and API data, integrated with react‑hook‑form. |
| `lucide‑react` | ^0.3.0 | Consistent, customizable icon set. |
| `@types/node` & `@types/react` | latest | TypeScript definitions. |

**Installation command:**
```bash
npm install next@14.2.0 react@18.2.0 react-dom@18.2.0 tailwindcss@4.0.0 @tailwindcss/postcss class-variance-authority clsx framer-motion @headlessui/react swiper react-hook-form zod lucide-react
```

## 3. Button Component (`src/components/ui/Button.tsx`)

Full implementation with `cva` for variants and sizes:

```tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg font-semibold ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-button text-white hover:bg-primary-600 active:bg-primary-700',
        secondary: 'bg-secondary-100 text-secondary-800 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-200 dark:hover:bg-secondary-700',
        outline: 'border border-secondary-300 bg-transparent text-secondary-800 hover:bg-secondary-50 dark:border-secondary-600 dark:text-secondary-200 dark:hover:bg-secondary-800',
        ghost: 'bg-transparent text-secondary-800 hover:bg-secondary-100 dark:text-secondary-200 dark:hover:bg-secondary-800',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6 text-base',
        lg: 'h-14 px-8 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

## 4. Pricing Card Component (`src/components/sections/PricingCard.tsx`)

Component that renders a pricing tier with toggleable annual/monthly billing:

```tsx
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
```

## 5. Next.js Configuration Snippet (`next.config.js`)

Optimized for performance, image handling, and dark mode:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    optimizeCss: true,
  },
  // Enable dark mode support via class strategy
  darkMode: 'class',
};

module.exports = nextConfig;
```

## 6. Tailwind Configuration Integration (`tailwind.config.js`)

Extends the design system colors, fonts, and gradients:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2872fa',
          600: '#1559ed',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f2f5f7',
          100: '#e1e8ed',
          200: '#c8d4de',
          300: '#a0b4c8',
          400: '#7b95ad',
          500: '#5a738c',
          600: '#3a4f66',
          700: '#2d3f52',
          800: '#192a3d',
          900: '#0f1a26',
        },
        accent: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
      },
      fontFamily: {
        heading: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        body: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', '"Open Sans"', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #2872fa 0%, #10b981 100%)',
        'gradient-button': 'linear-gradient(90deg, #2872fa, #1559ed)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
```

## 7. Additional Utilities (`src/lib/utils.ts`)

Create a `utils.ts` file for the `cn` helper (used in the components):

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## 8. Summary

The provided architecture and components deliver:

- **Scalable folder structure** that separates concerns and promotes reusability.
- **Production‑ready UI components** with full TypeScript support and variant systems.
- **Performance‑optimized Next.js configuration** with image optimization and dark‑mode support.
- **Tailwind configuration** that directly implements the design system tokens.

All code follows modern React/Next.js best practices, is fully typed, and ready to be integrated into the WhatsAuto SaaS landing page.