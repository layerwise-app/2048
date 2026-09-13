import { cn } from '~/lib/utils';

export function GameLogo({ className }: { className?: string }) {
  return (
    <h1
      className={cn(
        'font-heading text-6xl leading-none font-bold text-[#776e65] dark:text-[#eee4da]',
        className,
      )}
    >
      2048
    </h1>
  );
}
