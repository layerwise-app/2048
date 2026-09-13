import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '~/components/ui/button';
import { GameLogo } from '~/components/GameLogo';
import { getAuthSession } from '~/lib/auth.functions';
import { cn } from '~/lib/utils';
import { getTopScores } from '~/lib/scores.functions';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/top-100')({
  beforeLoad: async () => {
    const session = await getAuthSession();
    if (!session) {
      return { user: null };
    }
    return { user: session.user };
  },
  loader: async () => {
    const scores = await getTopScores();
    return { scores };
  },
  head: () => ({
    meta: [
      ...seo({
        title: 'Top 100',
        description: 'The highest 2048 scores from signed-in players'
      })
    ]
  }),
  component: Top100Page
});

function Top100Page() {
  const { scores } = Route.useLoaderData();
  const { user } = Route.useRouteContext();

  return (
    <div className='flex min-h-dvh items-start justify-center bg-[#faf8ef] px-4 py-8 dark:bg-[#1b1917] sm:items-center'>
      <div className='w-full max-w-[500px]'>
        <div className='flex items-end justify-between gap-4'>
          <div>
            <GameLogo />
            <h1 className='font-heading text-6xl font-bold text-[#776e65] dark:text-[#eee4da]'>
              Top 100
            </h1>
            <p className='mt-1 max-w-[28ch] text-sm text-[#8f857c] dark:text-[#a79d92]'>
              Highest scores from signed-in players.
            </p>
          </div>
          <Button asChild className='rounded-lg bg-[#8f7a66] text-white hover:bg-[#7d6a58]'>
            <Link to='/'>Back to game</Link>
          </Button>
          {user ? (
            <Button asChild className='rounded-lg bg-[#8f7a66] text-white hover:bg-[#7d6a58]'>
              <Link to='/dashboard'>{user.name || 'Account'}</Link>
            </Button>
          ) : (
            <Button asChild className='rounded-lg bg-[#8f7a66] text-white hover:bg-[#7d6a58]'>
              <Link to='/sign-in'>Sign in</Link>
            </Button>
          )}
        </div>

        <div className='mt-5 rounded-xl bg-[#bbada0] p-3 shadow-[0_12px_35px_rgba(0,0,0,0.16)]'>
          {scores.length === 0 ? (
            <p className='px-3 py-8 text-center text-sm font-medium text-[#eee4da]'>
              No scores yet. Play a game while signed in to appear here.
            </p>
          ) : (
            <ol className='space-y-2'>
              {scores.map((entry) => (
                <li
                  key={entry.userId}
                  className={cn(
                    'flex items-center justify-between gap-4 rounded-md px-3 py-2',
                    user?.id === entry.userId
                      ? 'bg-[rgba(238,228,218,0.45)]'
                      : 'bg-[rgba(238,228,218,0.35)]',
                  )}
                >
                  <div className='flex min-w-0 items-center gap-3'>
                    <span className='w-8 text-sm font-bold text-[#776e65] tabular-nums'>
                      {entry.rank}
                    </span>
                    <span className='truncate font-bold text-[#776e65]'>
                      {entry.name}
                    </span>
                    {user?.id === entry.userId && (
                      <span className='rounded bg-[#edc22e] px-1.5 py-0.5 text-[10px] font-bold text-white uppercase'>
                        You
                      </span>
                    )}
                  </div>
                  <span className='font-bold text-[#776e65] tabular-nums'>
                    {entry.score.toLocaleString()}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <p className='mt-5 text-center text-sm text-[#8f857c] dark:text-[#a79d92]'>
          Scores are saved when signed-in users play.
        </p>
      </div>
    </div>
  );
}
