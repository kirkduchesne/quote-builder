import { cn } from '@/lib/utils';

export const brand = {
  name: 'Tallyleaf',
  tagline: 'Estimates, neatly tallied.',
};

// A leaf whose veins are tally marks: four strokes and the fifth across.
export function TallyleafMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      className={cn('h-10 w-10', className)}
    >
      <rect width="40" height="40" rx="11" className="fill-primary" />
      <path
        d="M9 30C9 17 17 9 31 9c0 14-8 22-22 21Z"
        className="fill-primary-foreground/95"
      />
      <g
        className="stroke-primary"
        strokeWidth="1.9"
        strokeLinecap="round"
        fill="none"
      >
        <path d="M14.5 18.5v8" />
        <path d="M18 15.5v11" />
        <path d="M21.5 13.5v10" />
        <path d="M25 12v8.5" />
      </g>
      <path
        d="M12.5 25.5 27.5 14"
        stroke="hsl(var(--brass))"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'font-display text-2xl font-semibold tracking-tight text-foreground',
        className,
      )}
    >
      Tally<span className="text-primary">leaf</span>
    </span>
  );
}
