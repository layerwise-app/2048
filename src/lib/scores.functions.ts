import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '~/db';
import { gameScores, user } from '~/db/schema';
import { auth } from '~/lib/auth';

const MAX_SCORE = 3_932_100;

export const submitGameScore = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    if (
      typeof input !== 'object' ||
      input === null ||
      !('score' in input) ||
      typeof input.score !== 'number' ||
      !Number.isInteger(input.score) ||
      input.score < 0 ||
      input.score > MAX_SCORE
    ) {
      throw new Error('Invalid score');
    }
    return { score: input.score };
  })
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({
      headers: getRequestHeaders(),
    });
    if (!session) {
      return { saved: false };
    }

    const now = new Date();
    await db.insert(gameScores).values({
      userId: session.user.id,
      score: data.score,
      createdAt: now,
      updatedAt: now,
    });

    return { saved: true };
  });

export const getTopScores = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db
      .select({
        rank: sql<number>`row_number() over (order by ${gameScores.score} desc)`,
        score: gameScores.score,
        userId: gameScores.userId,
        name: user.name,
        email: user.email,
        updatedAt: gameScores.updatedAt,
      })
      .from(gameScores)
      .innerJoin(user, eq(user.id, gameScores.userId))
      .orderBy(desc(gameScores.score))
      .limit(100);
  },
);

export const getUserScores = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await auth.api.getSession({
      headers: getRequestHeaders(),
    });
    if (!session) {
      return [];
    }

    return db
      .select({
        id: gameScores.id,
        score: gameScores.score,
        createdAt: gameScores.createdAt,
        rank: sql<number>`row_number() over (order by ${gameScores.score} desc)`,
      })
      .from(gameScores)
      .where(eq(gameScores.userId, session.user.id))
      .orderBy(desc(gameScores.createdAt))
      .limit(200);
  },
);
