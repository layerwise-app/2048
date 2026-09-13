import { useCallback, useEffect, useRef, useState } from 'react';
import type * as React from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '~/components/ui/button';
import { getAuthSession } from '~/lib/auth.functions';
import { submitGameScore } from '~/lib/scores.functions';
import { cn } from '~/lib/utils';

type Tile = {
  id: number;
  value: number;
  x: number;
  y: number;
  isNew?: boolean;
  mergedFrom?: [number, number];
  justMerged?: boolean;
};

type Point = { x: number; y: number };

type MoveResult = {
  tiles: Tile[];
  moved: boolean;
  gained: number;
  maxValue: number;
  nextId: number;
};

type AudioName = 'move' | 'merge' | 'win' | 'lose';

const STORAGE_KEY = '2048-state';

const GRID = 4;
const BOARD_PX = 440;
const GAP_PX = 12;
const TILE_PX = (BOARD_PX - GAP_PX * 5) / 4;

const TILE_STYLES: Record<number, string> = {
  2: 'bg-[#eee4da] text-[#776e65]',
  4: 'bg-[#ede0c8] text-[#776e65]',
  8: 'bg-[#f2b179] text-white',
  16: 'bg-[#f59563] text-white',
  32: 'bg-[#f67c5f] text-white',
  64: 'bg-[#f65e3b] text-white',
  128: 'bg-[#edcf72] text-white shadow-[0_0_30px_10px_rgba(243,215,116,0.24)]',
  256: 'bg-[#edcc61] text-white shadow-[0_0_30px_10px_rgba(243,215,116,0.32)]',
  512: 'bg-[#edc850] text-white shadow-[0_0_30px_10px_rgba(243,215,116,0.4)]',
  1024: 'bg-[#edc53f] text-white shadow-[0_0_30px_10px_rgba(243,215,116,0.48)]',
  2048: 'bg-[#edc22e] text-white shadow-[0_0_30px_10px_rgba(243,215,116,0.56)]',
};

const FONT_SIZES: Record<number, string> = {
  2: 'text-5xl',
  4: 'text-5xl',
  8: 'text-5xl',
  16: 'text-4xl',
  32: 'text-4xl',
  64: 'text-4xl',
  128: 'text-4xl',
  256: 'text-4xl',
  512: 'text-4xl',
  1024: 'text-3xl',
  2048: 'text-3xl',
};

function emptyCells(tiles: Tile[]) {
  const cells: Point[] = [];
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (!tiles.some((tile) => tile.x === x && tile.y === y)) {
        cells.push({ x, y });
      }
    }
  }
  return cells;
}

function addRandomTile(tiles: Tile[], nextId: number) {
  const available = emptyCells(tiles);
  if (available.length === 0) {
    return tiles;
  }
  const cell = available[Math.floor(Math.random() * available.length)];
  return [
    ...tiles,
    {
      id: nextId,
      value: Math.random() < 0.9 ? 2 : 4,
      x: cell.x,
      y: cell.y,
      isNew: true,
    },
  ];
}

function createInitialTiles() {
  let nextId = 1;
  let tiles: Tile[] = [];
  tiles = addRandomTile(tiles, nextId++);
  tiles = addRandomTile(tiles, nextId);
  return { tiles, nextId: nextId + 1 };
}

function moveTiles(tiles: Tile[], direction: Direction, nextId: number): MoveResult {
  const movedTiles = tiles.map((tile) => ({ ...tile }));
  const originalPositions = new Map(
    movedTiles.map((tile) => [tile.id, { x: tile.x, y: tile.y }]),
  );
  let gained = 0;
  let maxValue = 0;

  const vector =
    direction === 'left'
      ? { x: -1, y: 0 }
      : direction === 'right'
        ? { x: 1, y: 0 }
        : direction === 'up'
          ? { x: 0, y: -1 }
          : { x: 0, y: 1 };

  for (let line = 0; line < GRID; line++) {
    const cells: Point[] = [];
    for (let index = 0; index < GRID; index++) {
      if (direction === 'left') {
        cells.push({ x: index, y: line });
      } else if (direction === 'right') {
        cells.push({ x: GRID - 1 - index, y: line });
      } else if (direction === 'up') {
        cells.push({ x: line, y: index });
      } else {
        cells.push({ x: line, y: GRID - 1 - index });
      }
    }

    const lineTiles = cells
      .map((cell) => movedTiles.find((tile) => tile.x === cell.x && tile.y === cell.y))
      .filter((tile): tile is Tile => Boolean(tile));

    for (let index = 0; index < lineTiles.length; index++) {
      const current = lineTiles[index];
      const next = lineTiles[index + 1];
      if (current && next && current.value === next.value) {
        current.value *= 2;
        current.justMerged = true;
        current.mergedFrom = [next.id, current.id];
        gained += current.value;
        maxValue = Math.max(maxValue, current.value);
        movedTiles.splice(
          movedTiles.findIndex((tile) => tile.id === next.id),
          1,
        );
        index++;
      }
    }

    const survivingTiles = lineTiles.filter((tile) => movedTiles.includes(tile));
    survivingTiles.forEach((tile, index) => {
      tile.x = cells[index].x;
      tile.y = cells[index].y;
    });
  }

  const moved =
    gained > 0 ||
    movedTiles.some((tile) => {
      const original = originalPositions.get(tile.id);
      return original && (original.x !== tile.x || original.y !== tile.y);
    });

  return { tiles: movedTiles, moved, gained, maxValue, nextId };
}

function hasMoves(tiles: Tile[]) {
  if (emptyCells(tiles).length > 0) {
    return true;
  }
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const tile = tiles.find((item) => item.x === x && item.y === y);
      const right = tiles.find((item) => item.x === x + 1 && item.y === y);
      const down = tiles.find((item) => item.x === x && item.y === y + 1);
      if (tile && ((right && right.value === tile.value) || (down && down.value === tile.value))) {
        return true;
      }
    }
  }
  return false;
}

type Direction = 'up' | 'down' | 'left' | 'right';

function useAudio() {
  const contextRef = useRef<AudioContext | null>(null);
  return useCallback((name: AudioName) => {
    if (typeof window === 'undefined') {
      return;
    }
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) {
      return;
    }
    contextRef.current ??= new AudioContextClass();
    const context = contextRef.current;
    void context.resume();

    const now = context.currentTime;
    const gain = context.createGain();
    gain.connect(context.destination);

    if (name === 'move') {
      const oscillator = context.createOscillator();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(210, now);
      oscillator.frequency.exponentialRampToValueAtTime(150, now + 0.07);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
      oscillator.connect(gain);
      oscillator.start(now);
      oscillator.stop(now + 0.1);
      return;
    }

    if (name === 'merge') {
      const oscillator = context.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(520, now);
      oscillator.frequency.exponentialRampToValueAtTime(780, now + 0.08);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      oscillator.connect(gain);
      oscillator.start(now);
      oscillator.stop(now + 0.15);
      return;
    }

    const notes = name === 'win' ? [523.25, 659.25, 783.99, 1046.5] : [392, 311.13, 261.63, 174.61];
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const noteGain = context.createGain();
      const start = now + index * 0.12;
      oscillator.type = name === 'win' ? 'sine' : 'triangle';
      oscillator.frequency.value = frequency;
      noteGain.gain.setValueAtTime(0.0001, start);
      noteGain.gain.exponentialRampToValueAtTime(0.09, start + 0.03);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
      oscillator.connect(noteGain);
      noteGain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.24);
    });
  }, []);
}

export function Game2048() {
  const [initialState] = useState(createInitialTiles);
  const [tiles, setTiles] = useState<Tile[]>(initialState.tiles);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [nextId, setNextId] = useState(initialState.nextId);
  const [soundOn, setSoundOn] = useState(true);
  const [shake, setShake] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const playSound = useAudio();
  const tilesRef = useRef(tiles);
  const scoreRef = useRef(score);
  const nextIdRef = useRef(nextId);
  const touchStart = useRef<Point | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);

  tilesRef.current = tiles;
  scoreRef.current = score;
  nextIdRef.current = nextId;

  useEffect(() => {
    const stored = Number(window.localStorage.getItem('2048-best') || 0);
    setBest(Number.isFinite(stored) ? stored : 0);
  }, []);

  useEffect(() => {
    void getAuthSession()
      .then((session) => {
        setCurrentUser(session?.user ?? null);
      })
      .catch(() => setCurrentUser(null));
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored) as {
        tiles: Tile[];
        score: number;
        nextId: number;
        gameOver: boolean;
        won: boolean;
      };
      if (
        Array.isArray(parsed.tiles) &&
        parsed.tiles.every(
          (tile) =>
            typeof tile.id === 'number' &&
            typeof tile.value === 'number' &&
            Number.isInteger(tile.x) &&
            tile.x >= 0 &&
            tile.x < GRID &&
            Number.isInteger(tile.y) &&
            tile.y >= 0 &&
            tile.y < GRID,
        )
      ) {
        setTiles(parsed.tiles.map((tile) => ({ ...tile })));
        setScore(parsed.score || 0);
        setNextId(parsed.nextId || 1);
        setGameOver(Boolean(parsed.gameOver));
        setWon(Boolean(parsed.won));
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (score > best) {
      setBest(score);
      window.localStorage.setItem('2048-best', String(score));
    }
  }, [best, score]);

  useEffect(() => {
    if (!tiles.some((tile) => tile.isNew || tile.justMerged)) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setTiles((current) =>
        current.map((tile) =>
          tile.isNew || tile.justMerged
            ? { ...tile, isNew: false, justMerged: false }
            : tile,
        ),
      );
    }, 170);
    return () => window.clearTimeout(timeout);
  }, [tiles]);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ tiles, score, nextId, gameOver, won }),
    );
  }, [gameOver, nextId, score, tiles, won]);

  const reset = useCallback(() => {
    const state = createInitialTiles();
    setTiles(state.tiles);
    setScore(0);
    setGameOver(false);
    setWon(false);
    setNextId(state.nextId);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const submitFinalScore = useCallback(async () => {
    if (!currentUser) {
      return;
    }
    await submitGameScore({ data: { score: scoreRef.current } });
    setCurrentUser((current) =>
      current ? { ...current, name: current.name } : current,
    );
  }, [currentUser]);

  const handleMove = useCallback(
    (direction: Direction) => {
      if (gameOver) {
        return;
      }
      const result = moveTiles(tilesRef.current, direction, nextIdRef.current);
      if (!result.moved) {
        setShake(true);
        window.setTimeout(() => setShake(false), 180);
        return;
      }

      const updated = addRandomTile(result.tiles, result.nextId).map((tile) => ({
        ...tile,
        isNew: false,
        justMerged: false,
      }));
      updated.forEach((tile) => {
        const source = result.tiles.find((item) => item.id === tile.id);
        if (source) {
          tile.isNew = Boolean(source.isNew);
          tile.justMerged = Boolean(source.justMerged);
        }
      });
      setTiles(updated);
      setNextId(result.nextId + 1);
      setScore((current) => current + result.gained);

      if (soundOn && result.gained > 0) {
        playSound('merge');
      } else if (soundOn) {
        playSound('move');
      }

      if (result.maxValue >= 2048 && !won) {
        setWon(true);
        if (soundOn) {
          playSound('win');
        }
      } else if (!hasMoves(updated)) {
        setGameOver(true);
        if (soundOn) {
          playSound('lose');
        }
      }

    },
    [gameOver, playSound, soundOn, won],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const directions: Partial<Record<string, Direction>> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      };
      const direction = directions[event.key];
      if (!direction) {
        return;
      }
      event.preventDefault();
      handleMove(direction);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleMove]);

  const touchDistance = (event: TouchEvent) => {
    const start = touchStart.current;
    if (!start) {
      return null;
    }
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) {
      return null;
    }
    return Math.abs(dx) > Math.abs(dy)
      ? dx > 0
        ? 'right'
        : 'left'
      : dy > 0
        ? 'down'
        : 'up';
  };

  const onTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    const direction = touchDistance(event.nativeEvent as TouchEvent);
    touchStart.current = null;
    if (direction) {
      handleMove(direction);
    }
  };

  const cellPositions = Array.from({ length: GRID * GRID }, (_, index) => ({
    x: index % GRID,
    y: Math.floor(index / GRID),
  }));

  return (
    <div className='w-full max-w-[500px]'>
      <div className='flex items-end justify-between gap-4'>
        <div>
          <h1 className='font-heading text-6xl font-bold text-[#776e65] dark:text-[#eee4da]'>2048</h1>
          <p className='mt-1 max-w-[28ch] text-sm text-[#8f857c] dark:text-[#a79d92]'>
            Join tiles, reach 2048.
          </p>
        </div>
        <div className='flex gap-2'>
          <Stat label='Score' value={score} />
          <Stat label='Best' value={best} />
        </div>
      </div>

      <div className='mt-5 flex items-center justify-between gap-3'>
        <div className='flex flex-1 items-center gap-2'>
          <Button onClick={reset} className='rounded-lg bg-[#8f7a66] text-white hover:bg-[#7d6a58]'>
            New game
          </Button>
          <Button
            onClick={() => setSoundOn((value) => !value)}
            aria-pressed={soundOn}
            className='rounded-lg bg-[#8f7a66] text-white hover:bg-[#7d6a58]'
          >
            Sound {soundOn ? 'on' : 'off'}
          </Button>
        </div>
        <Button asChild className='rounded-lg bg-[#edc22e] px-4 text-white hover:bg-[#e2b32a]'>
          <Link to='/top-100'>Top 100</Link>
        </Button>
        {currentUser ? (
          <Button asChild className='rounded-lg bg-[#8f7a66] text-white hover:bg-[#7d6a58]'>
            <Link to='/dashboard'>{currentUser.name || 'Account'}</Link>
          </Button>
        ) : (
          <Button asChild className='rounded-lg bg-[#8f7a66] text-white hover:bg-[#7d6a58]'>
            <Link to='/sign-in'>Sign in</Link>
          </Button>
        )}
      </div>

      <div
        ref={boardRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className={cn(
          'relative mt-4 touch-pan-y select-none rounded-xl bg-[#bbada0] p-3 shadow-[0_12px_35px_rgba(0,0,0,0.16)]',
          shake && 'animate-board-shake',
        )}
        style={{
          width: '100%',
          maxWidth: BOARD_PX,
          aspectRatio: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: GAP_PX,
        }}
      >
        {cellPositions.map((cell) => (
          <div
            key={`${cell.x}-${cell.y}`}
            className='rounded-md bg-[rgba(238,228,218,0.35)]'
          />
        ))}

        <div className='pointer-events-none absolute inset-0'>
          {tiles.map((tile) => (
            <div
              key={tile.id}
              className={cn(
                'absolute flex items-center justify-center rounded-md font-bold tabular-nums',
                TILE_STYLES[tile.value] ?? 'bg-[#3c3a32] text-white',
                FONT_SIZES[tile.value] ?? 'text-3xl',
                tile.isNew && 'tile-new',
                tile.justMerged && 'tile-merged',
              )}
              style={{
                width: 'calc((100% - 60px) / 4)',
                height: 'calc((100% - 60px) / 4)',
                translate: `calc(${tile.x} * (100% + 12px) + 12px) calc(${tile.y} * (100% + 12px) + 12px)`,
                transition: 'translate 100ms ease-in-out',
              }}
            >
              {tile.value}
            </div>
          ))}
        </div>

        {gameOver && (
          <Overlay
            title='Game over!'
            score={score}
            currentUser={currentUser}
            onSubmitScore={submitFinalScore}
            action={reset}
            actionLabel='Try again'
          />
        )}
        {won && !gameOver && (
          <Overlay
            title='You win!'
            score={score}
            currentUser={currentUser}
            onSubmitScore={submitFinalScore}
            action={() => setWon(false)}
            actionLabel='Keep going'
          />
        )}
      </div>

      <p className='mt-5 text-center text-sm text-[#8f857c] dark:text-[#a79d92]'>
        Use arrow keys or swipe to move tiles.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className='min-w-[84px] rounded-lg bg-[#bbada0] px-4 py-2 text-center'>
      <div className='text-[11px] font-bold tracking-[0.08em] text-[#eee4da] uppercase'>
        {label}
      </div>
      <div className='text-2xl font-bold text-white tabular-nums'>{value}</div>
    </div>
  );
}

function Overlay({
  title,
  score,
  currentUser,
  onSubmitScore,
  action,
  actionLabel,
}: {
  title: string;
  score: number;
  currentUser: {
    id: string;
    name: string;
  } | null;
  onSubmitScore: () => Promise<void>;
  action: () => void;
  actionLabel: string;
}) {
  const [submitState, setSubmitState] = useState<
    'idle' | 'saving' | 'saved'
  >('idle');

  const handleSubmit = async () => {
    if (submitState !== 'idle') {
      return;
    }
    setSubmitState('saving');
    await onSubmitScore();
    setSubmitState('saved');
  };

  return (
    <div className='absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-[rgba(238,228,218,0.73)] backdrop-blur-[2px]'>
      <p className='font-heading text-4xl font-bold text-[#776e65]'>{title}</p>
      <p className='mt-1 text-sm font-bold text-[#776e65]'>
        Final score: {score.toLocaleString()}
      </p>

      {currentUser ? (
        <Button
          onClick={handleSubmit}
          disabled={submitState !== 'idle'}
          className='mt-4 rounded-lg bg-[#edc22e] text-white hover:bg-[#e2b32a]'
        >
          {submitState === 'saving'
            ? 'Saving...'
            : submitState === 'saved'
              ? 'Saved'
              : 'Submit to Top 100'}
        </Button>
      ) : (
        <Button asChild className='mt-4 rounded-lg bg-[#edc22e] text-white hover:bg-[#e2b32a]'>
          <Link to='/sign-in'>Sign in to submit</Link>
        </Button>
      )}

      <Button
        onClick={action}
        className='mt-2 rounded-lg bg-[#8f7a66] text-white hover:bg-[#7d6a58]'
      >
        {actionLabel}
      </Button>
    </div>
  );
}
