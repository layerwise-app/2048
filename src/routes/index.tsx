import { createFileRoute } from '@tanstack/react-router';
import { Game2048 } from '~/components/Game2048';
import { PoweredByLayerwise } from '~/components/powered-by-layerwise';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      ...seo({
        title: '2048',
        description: 'The classic 2048 tile game with smooth animations and sounds'
      })
    ]
  }),
  component: Home
});

function Home() {
  return (
    <div className='relative flex min-h-dvh items-center justify-center bg-[#faf8ef] px-4 pt-8 pb-14 dark:bg-[#1b1917]'>
      <Game2048 />
      <PoweredByLayerwise className='absolute right-4 bottom-4' />
    </div>
  );
}
