import { useRef } from 'react';
import type * as React from 'react';
import { cn } from '~/lib/utils';

// Furthest a press may travel and still count as a tap rather than a swipe.
const TAP_SLOP_PX = 10;

// A small text credit for the corner of the page. Players swipe near it on phones, so it
// only opens for a press that starts on the link and stays put: a swipe from the board
// that ends here never opens it.
export function PoweredByLayerwise({ className }: { className?: string }) {
  const press = useRef<{ x: number; y: number; mouse: boolean } | null>(null);

  const onClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const start = press.current;
    press.current = null;
    // Keyboard and assistive-technology activations have no pointer press.
    if (event.detail === 0) {
      return;
    }
    const moved =
      start &&
      !start.mouse &&
      Math.hypot(event.clientX - start.x, event.clientY - start.y) > TAP_SLOP_PX;
    if (!start || moved) {
      event.preventDefault();
    }
  };

  return (
    <a
      href='https://layerwise.app'
      target='_blank'
      rel='noopener'
      onPointerDown={(event) => {
        press.current = {
          x: event.clientX,
          y: event.clientY,
          mouse: event.pointerType === 'mouse',
        };
      }}
      onPointerCancel={() => {
        press.current = null;
      }}
      onClick={onClick}
      className={cn(
        'rounded-sm text-xs text-[#8f857c] underline-offset-2 transition-colors hover:text-[#776e65] hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none dark:text-[#a79d92] dark:hover:text-[#eee4da]',
        className,
      )}
    >
      Make your own game with Layerwise
      <span className='sr-only'> (opens in a new tab)</span>
    </a>
  );
}
