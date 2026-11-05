import { cn } from '~/lib/utils';

// A small text credit, shown only on the game-over screen so it never sits on a live board.
export function PoweredByLayerwise({ className }: { className?: string }) {
  return (
    <a
      href='https://layerwise.app'
      target='_blank'
      rel='noopener'
      className={cn(
        'rounded-sm text-xs text-[#776e65]/80 underline-offset-2 transition-colors hover:text-[#776e65] hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        className,
      )}
    >
      Make your own game with Layerwise
      <span className='sr-only'> (opens in a new tab)</span>
    </a>
  );
}
