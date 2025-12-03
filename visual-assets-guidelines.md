# WhatsAuto Visual Assets & Guidelines

## Overview
This document defines strict guidelines for visual elements and assets used across the WhatsAuto SaaS landing page. The goal is to ensure visual consistency, performance, and accessibility while aligning with the brand voice: **professional‑empathetic, dynamic‑tech, trustworthy**.

These guidelines extend the existing [Design System](./design-system.md) and [Landing Page Architecture](./landing-page-architecture.md).

---

## 1. Iconography

### 1.1 Icon Family
- **Primary Library:** [Lucide React](https://lucide.dev/) (version ^0.3.0)
- **Rationale:** Lucide provides a consistent, MIT‑licensed icon set with a clean, modern aesthetic that matches the tech‑forward brand. It offers a wide range of icons, excellent TypeScript support, and easy customization.
- **Custom SVG Icons:** Only use custom SVG icons when a specific brand‑unique symbol is required (e.g., logo, product‑specific illustration). Custom icons must follow the same stroke‑width (2px) and visual weight as Lucide icons.

### 1.2 Sizing & Context
| Context | Size (px) | Tailwind Class | Example Usage |
|---------|-----------|----------------|---------------|
| Navigation icons | 20×20 | `w-5 h-5` | Header menu, footer links |
| Feature card icons | 40×40 | `w-10 h-10` | Benefit cards, “How It Works” steps |
| Button icons (inline) | 16×16 | `w-4 h-4` | Buttons with text + icon |
| Large hero/icons | 64×64 | `w-16 h-16` | Hero section illustrations |
| Animated icons | 24×24 (default) | `size={24}` | `AnimatedIcon` component |

### 1.3 Color Usage
- **Default:** `currentColor` – inherits parent text color for maximum flexibility.
- **Semantic colors:** Use design‑system tokens for contextual meaning:
  - Primary actions: `text-primary-500`
  - Success/positive: `text-accent-500`
  - Error/warning: `text-error` (`#ef4444`)
  - Neutral/secondary: `text-secondary-500`
- **Dark mode:** Ensure icons adapt via `dark:` modifiers (e.g., `dark:text-primary-400`).

### 1.4 Code Examples
```tsx
import { Zap, CheckCircle, Settings } from 'lucide-react';

// Navigation icon
<Zap className="w-5 h-5 text-primary-500" />

// Feature card icon with background
<div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center">
  <Settings className="w-7 h-7 text-primary-600" />
</div>

// Using the AnimatedIcon component
<AnimatedIcon
  icon={CheckCircle}
  animation="pulse"
  size={40}
  color="var(--color-accent-500)"
  hoverColor="var(--color-accent-600)"
/>
```

### 1.5 Spacing & Alignment
- Icons inside buttons should have a **4px (0.25rem)** gap between icon and text. Use Tailwind’s `gap-2` or `space-x-2`.
- Icons in feature cards should be centered horizontally and have **24px (1.5rem)** margin below the icon before the heading.

---

## 2. Illustration & Image Style

### 2.1 Artistic Direction
- **Style:** Abstract‑modern, using the defined color palette (blues, greens, neutral grays).
- **Avoid** generic stock photos; prioritize custom illustrations or realistic UI mockups.
- **Mood:** Conveys efficiency, connectivity, and growth. Use geometric shapes, soft gradients, and subtle shadows.

### 2.2 Image Treatment
| Aspect | Guideline | Example Tailwind Classes |
|--------|-----------|--------------------------|
| Border radius | Consistent rounded‑xl (1rem) for cards, rounded‑2xl for hero assets | `rounded-xl`, `rounded-2xl` |
| Shadows | Elevation levels: <br>‑ Base: `shadow-lg` <br>‑ Hover: `shadow-2xl` <br>‑ Hero: `shadow-2xl` with backdrop blur | `shadow-lg hover:shadow-2xl` |
| Aspect ratios | Hero: 16:9 (landscape) <br> Feature illustrations: 1:1 (square) <br> Screenshots: 4:3 | Use `aspect-video`, `aspect-square`, `aspect-4/3` |
| Backgrounds | Use `bg-secondary-50` for light mode, `bg-secondary-900` for dark mode. Overlays with `bg-white/10` for glassmorphism effects. | `bg-secondary-50 dark:bg-secondary-900` |

### 2.3 Custom Illustrations
- Create illustrations in Figma or SVG format.
- Use the brand gradient (`linear-gradient(135deg, #2872fa 0%, #10b981 100%)`) sparingly for accent elements.
- Stroke width: 2px for outlines, fills with solid colors at 80% opacity for layered effects.

### 2.4 Example Implementation
```html
<!-- Hero illustration container -->
<div class="bg-white/10 rounded-2xl p-2 backdrop-blur-sm">
  <img
    src="/assets/hero-dashboard.svg"
    alt="WhatsAuto dashboard showing conversation analytics"
    class="w-full h-auto rounded-xl"
  />
</div>

<!-- Feature illustration -->
<div class="aspect-square bg-gradient-primary rounded-2xl p-8 flex items-center justify-center">
  <!-- Custom SVG or Lucide icon -->
</div>
```

---

## 3. Placeholders & Loading States

### 3.1 Skeleton Loaders
Skeleton loaders provide a non‑jarring experience while content is being fetched. Use the following Tailwind‑based CSS patterns.

### 3.2 Skeleton Components
Create reusable skeleton components in `src/components/ui/Skeleton.tsx`:

```tsx
// Skeleton.tsx
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-secondary-200 dark:bg-secondary-800 rounded',
        className
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="p-6 rounded-2xl border border-secondary-200 dark:border-secondary-800">
      <Skeleton className="h-10 w-1/3 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={i === lines - 1 ? 'h-4 w-3/4' : 'h-4 w-full'}
        />
      ))}
    </div>
  );
}
```

### 3.3 Usage in Sections
```tsx
// While loading features
<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
  {loading
    ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
    : features.map(feature => <FeatureCard {...feature} />)}
</div>
```

### 3.4 Image Placeholders
- Use a solid `bg-secondary-100` with a subtle gradient as a placeholder before images load.
- For Next.js Image component, set `placeholder="blur"` and `blurDataURL` to a tiny base64‑encoded image.

---

## 4. Logo Usage

### 4.1 Logo Variations
| Variation | Description | Usage |
|-----------|-------------|-------|
| **Full logo** | “WhatsAuto” wordmark + icon (if applicable) | Header, footer, print materials |
| **Icon only** | Standalone icon (e.g., a stylized “W” or chat bubble) | Favicon, mobile navigation, social avatars |
| **Monochrome** | Single‑color version (white or black) | Dark/light backgrounds, overlays |

### 4.2 Clear Space
- Maintain a clear space equal to **half the logo’s height** on all sides.
- Never place text, icons, or other graphic elements inside this zone.

### 4.3 Placement
- **Header:** Left‑aligned, with a minimum height of 40px.
- **Footer:** Centered or left‑aligned in the first column.
- **Favicon:** 32×32px PNG (also generate ICO and SVG versions).

### 4.4 File Formats
- **Primary:** SVG (vector) for web, PNG (transparent) for fallback.
- **Print:** PDF or EPS.
- **Social:** Square PNG (1024×1024) with padding.

### 4.5 Example Implementation
```html
<header class="container mx-auto px-6 py-4">
  <a href="/">
    <!-- Full logo -->
    <img
      src="/logo/logo-full.svg"
      alt="WhatsAuto"
      class="h-10 w-auto"
    />
    <!-- Icon only for mobile -->
    <img
      src="/logo/logo-icon.svg"
      alt=""
      class="h-8 w-8 md:hidden"
    />
  </a>
</header>
```

---

## 5. Asset Optimization Guidelines

### 5.1 Image Formats
- **Primary:** WebP (better compression) and AVIF (next‑gen).
- **Fallback:** JPEG for older browsers.
- **SVG:** For logos, icons, and illustrations.

Configure Next.js to serve modern formats automatically (already set in `next.config.js`):
```javascript
images: {
  formats: ['image/avif', 'image/webp'],
}
```

### 5.2 Compression Tools
- **Squoosh** (web‑based) for manual optimization.
- **Sharp** (Node.js) for automated build‑time optimization (Next.js uses Sharp by default).
- **ImageOptim** (mac) / **FileOptimizer** (Windows) for batch compression.

### 5.3 Lazy Loading Strategy
- Use Next.js Image component with `loading="lazy"` for below‑the‑fold images.
- Set `priority={true}` for above‑the‑fold images (LCP elements).
- Always define `width` and `height` to prevent layout shift.

```tsx
import Image from 'next/image';

<Image
  src="/assets/hero-dashboard.webp"
  alt="Dashboard"
  width={1200}
  height={675}
  priority
  className="rounded-2xl"
/>
```

### 5.4 CDN & Caching
- Serve static assets via a CDN (e.g., Vercel’s edge network).
- Set cache‑control headers: `public, max-age=31536000, immutable` for hashed assets.

---

## 6. Accessibility for Visual Elements

### 6.1 Icon Accessibility
- Every icon that conveys meaning must have an `aria-label` or a visible text alternative.
- Decorative icons should have `aria-hidden="true"`.

```tsx
// Meaningful icon
<button aria-label="Settings">
  <Settings className="w-5 h-5" />
</button>

// Decorative icon
<div aria-hidden="true">
  <Sparkles className="w-6 h-6" />
</div>
```

### 6.2 Contrast Ratios
- Ensure icon colors meet WCAG AA contrast requirements (≥ 3:1 for graphical objects).
- Use the design system’s pre‑tested color pairs (e.g., `primary-500` on `white` = 4.6:1 ✅).

### 6.3 Image Alt Text
- **Descriptive alt text** for informative images (e.g., “Dashboard showing conversation analytics”).
- **Empty alt** (`alt=""`) for purely decorative images.
- **Avoid** “image of…” or “picture of…” redundancy.

### 6.4 Reduced Motion
- Respect `prefers‑reduced‑motion` media query for animated icons and illustrations.
- In `AnimatedIcon`, conditionally disable animations if `window.matchMedia('(prefers-reduced-motion: reduce)')` returns true.

### 6.5 Focus Indicators
- Ensure interactive icons (buttons, links) have a visible focus ring (`focus-visible:ring-2 focus-visible:ring-primary-500`).

---

## 7. Implementation Checklist
- [ ] Install and configure `lucide-react`.
- [ ] Create `Skeleton` components in `src/components/ui/`.
- [ ] Place logo variations in `public/logo/`.
- [ ] Optimize all existing images with Squoosh/Sharp.
- [ ] Add `aria-label` to all interactive icons.
- [ ] Test contrast ratios with a tool like **WebAIM Contrast Checker**.
- [ ] Verify lazy‑loading behavior in Lighthouse.

---

## 8. References
- [Design System](./design-system.md)
- [Landing Page Architecture](./landing-page-architecture.md)
- [Lucide Icons](https://lucide.dev/)
- [Next.js Image Documentation](https://nextjs.org/docs/api-reference/next/image)
- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)

---

*Document version: 1.0  
Last updated: 2025‑12‑03*