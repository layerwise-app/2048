import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router';
import { Button } from '~/components/ui/button';
import { GameLogo } from '~/components/GameLogo';
import { UserProfileDialog } from '~/components/UserProfileDialog';
import { getAuthSession } from '~/lib/auth.functions';
import { getUserScores } from '~/lib/scores.functions';
import { authClient, signOut } from '~/lib/auth-client';
import { seo } from '~/utils/seo';

const historyFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC'
});

const registeredFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC'
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
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();
  const { scores } = Route.useLoaderData();
  const createdAt = registeredFormatter.format(new Date(user.createdAt));
  const bestScore = Math.max(0, ...scores.map((entry) => entry.score));

  return (
    <div className='flex min-h-dvh items-start justify-center bg-[#faf8ef] px-4 py-8 dark:bg-[#1b1917] sm:items-center'>
      <div className='w-full max-w-[500px]'>
        <div className='flex items-end justify-between gap-4'>
          <div>
            <GameLogo />
            <p className='mt-1 max-w-[28ch] text-sm text-[#8f857c] dark:text-[#a79d92]'>
              Your games and score history.
            </p>
          </div>
          <Button asChild className='rounded-lg bg-[#8f7a66] text-white hover:bg-[#7d6a58]'>
            <Link to='/'>Back to game</Link>
          </Button>
        </div>

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
              {scores.map((entry, index) => (
                <li
                  key={entry.id}
                  className='flex items-center justify-between gap-3 rounded-md bg-[rgba(238,228,218,0.35)] px-3 py-2'
                >
                  <div className='flex min-w-0 items-center gap-3'>
                    <span className='w-7 text-sm font-bold text-[#776e65] tabular-nums'>
                      {scores.length - index}
                    </span>
                    <span className='text-sm font-bold text-[#776e65]'>
                      {historyFormatter.format(new Date(entry.createdAt))}
                    </span>
                  </div>
                  <span className='font-bold text-[#776e65] tabular-nums'>
                    #{entry.rank} · {entry.score.toLocaleString()}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <p className='mt-2 px-1 text-sm text-[#8f857c] dark:text-[#a79d92]'>
          Rank is your best placement across all players.
        </p>

        <div className='mt-10 rounded-xl bg-[#bbada0] p-3 shadow-[0_12px_35px_rgba(0,0,0,0.16)]'>
          <div className='flex items-start justify-between gap-4 px-1'>
            <div>
              <h2 className='font-heading text-2xl font-bold text-[#776e65]'>
                {user.name || 'Player'}
              </h2>
              <p className='text-sm font-medium text-[#eee4da]'>{user.email}</p>
            </div>
            <UserProfileDialog
              user={user}
              trigger={
                <Button className='rounded-lg bg-[#edc22e] text-white hover:bg-[#e2b32a]'>
                  Edit name
                </Button>
              }
            />
          </div>
          <div className='mt-3 flex gap-2 px-1 pb-1'>
            <div className='flex-1 rounded-md bg-[rgba(238,228,218,0.35)] px-3 py-2'>
              <p className='text-[11px] font-bold text-[#776e65] uppercase'>Registered</p>
              <p className='text-sm font-bold text-[#776e65]'>{createdAt}</p>
            </div>
            <div className='flex-1 rounded-md bg-[rgba(238,228,218,0.35)] px-3 py-2'>
              <p className='text-[11px] font-bold text-[#776e65] uppercase'>Verified</p>
              <p className='text-sm font-bold text-[#776e65]'>
                {user.emailVerified ? 'Yes' : 'No'}
              </p>
            </div>
          </div>

          <div className='mt-3 flex justify-end px-1 pb-1'>
            <Button
              onClick={async () => {
                await signOut();
                await navigate({ to: '/sign-in' });
              }}
              className='rounded-lg bg-[#a59a8d] text-white hover:bg-[#968b7e]'
            >
              Log out
            </Button>
          </div>
        </div>

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
