import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { Button } from '~/components/ui/button';
import { UserProfileDialog } from '~/components/UserProfileDialog';
import { getAuthSession } from '~/lib/auth.functions';
import { getUserScores } from '~/lib/scores.functions';
import { seo } from '~/utils/seo';

const createdAtFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
  timeZoneName: 'short'
});

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const session = await getAuthSession();
    if (!session) {
      throw redirect({ to: '/sign-in' });
    }

    return { user: session.user };
  },
  loader: async () => {
    const scores = await getUserScores();
    return { scores };
  },
  head: () => ({
    meta: [
      ...seo({
        title: 'Dashboard',
        description: 'View your account information'
      })
    ]
  }),
  component: DashboardPage
});

function DashboardPage() {
  const { user } = Route.useRouteContext();
  const { scores } = Route.useLoaderData();
  const createdAt = createdAtFormatter.format(new Date(user.createdAt));
  const bestScore = Math.max(0, ...scores.map((entry) => entry.score));

  return (
    <div className='flex min-h-dvh items-start justify-center bg-[#faf8ef] px-4 py-8 dark:bg-[#1b1917] sm:items-center'>
      <div className='w-full max-w-[500px]'>
        <div className='flex items-end justify-between gap-4'>
          <div>
            <h1 className='font-heading text-6xl font-bold text-[#776e65] dark:text-[#eee4da]'>
              Account
            </h1>
            <p className='mt-1 max-w-[28ch] text-sm text-[#8f857c] dark:text-[#a79d92]'>
              Your games and score history.
            </p>
          </div>
          <Button asChild className='rounded-lg bg-[#8f7a66] text-white hover:bg-[#7d6a58]'>
            <Link to='/'>Back to game</Link>
          </Button>
        </div>

        <UserProfileDialog user={user} />

        <div className='mt-5 flex gap-2'>
          <Stat label='Best score' value={bestScore} />
          <Stat label='Games' value={scores.length} />
        </div>

        <div className='mt-4 rounded-xl bg-[#bbada0] p-3 shadow-[0_12px_35px_rgba(0,0,0,0.16)]'>
          {scores.length === 0 ? (
            <p className='px-3 py-8 text-center text-sm font-medium text-[#eee4da]'>
              No submitted scores yet.
            </p>
          ) : (
            <ol className='space-y-2'>
              {scores.map((entry) => (
                <li
                  key={entry.id}
                  className='flex items-center justify-between gap-4 rounded-md bg-[rgba(238,228,218,0.35)] px-3 py-2'
                >
                  <span className='text-sm font-bold text-[#776e65]'>
                    {createdAtFormatter.format(new Date(entry.createdAt))}
                  </span>
                  <span className='font-bold text-[#776e65] tabular-nums'>
                    {entry.score.toLocaleString()}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <p className='mt-5 text-center text-sm text-[#8f857c] dark:text-[#a79d92]'>
          Signed in as {user.email}.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className='min-w-[84px] flex-1 rounded-lg bg-[#bbada0] px-4 py-2 text-center'>
      <div className='text-[11px] font-bold tracking-[0.08em] text-[#eee4da] uppercase'>
        {label}
      </div>
      <div className='text-2xl font-bold text-white tabular-nums'>{value}</div>
    </div>
  );
}
