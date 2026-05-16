import { Americana, Player, Match } from '@/types/americana';
import { supabase } from '@/lib/supabase';

const AMERICANAS_TABLE = 'americanas';

export const generateCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

export const createPlayer = (name: string): Player => ({
  id: generateId(),
  name,
  wins: 0,
  losses: 0,
  pointsFor: 0,
  pointsAgainst: 0,
});

export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};


const pairKey = (a: string, b: string): string => (a < b ? `${a}|${b}` : `${b}|${a}`);

const countOccurrences = (
  matches: Match[],
  extract: (m: Match) => [string, string][],
): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const m of matches) {
    for (const [a, b] of extract(m)) {
      const key = pairKey(a, b);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
};

const partnerCounts = (matches: Match[]) =>
  countOccurrences(matches, m => [m.team1, m.team2]);

const opponentCounts = (matches: Match[]) =>
  countOccurrences(matches, m => [
    [m.team1[0], m.team2[0]],
    [m.team1[0], m.team2[1]],
    [m.team1[1], m.team2[0]],
    [m.team1[1], m.team2[1]],
  ]);

// Optimal perfect matching via branch-and-bound backtracking.
// `units` are paired up (size must be even); `cost(a, b)` returns the cost of
// pairing units a and b. Returns the lowest-cost partition.
const findBestMatching = <T>(
  units: T[],
  cost: (a: T, b: T) => number,
): [T, T][] => {
  let bestCost = Infinity;
  let bestPairs: [T, T][] = [];
  const current: [T, T][] = [];

  const search = (remaining: T[], runningCost: number): void => {
    if (runningCost >= bestCost) return;
    if (remaining.length === 0) {
      bestCost = runningCost;
      bestPairs = [...current];
      return;
    }
    const [first, ...rest] = remaining;
    // Sort candidates by cost ascending so the most promising branches go first;
    // combined with the bestCost prune below this keeps the search tiny.
    const ranked = rest
      .map((u, i) => ({ u, i, c: cost(first, u) }))
      .sort((a, b) => a.c - b.c);

    for (const { u, i, c } of ranked) {
      if (runningCost + c >= bestCost) break;
      const next = rest.slice(0, i).concat(rest.slice(i + 1));
      current.push([first, u]);
      search(next, runningCost + c);
      current.pop();
      if (bestCost === 0) return;
    }
  };

  search(shuffleArray(units), 0);
  return bestPairs;
};

const buildPairs = (
  playerIds: string[],
  prior: Map<string, number>,
): [string, string][] =>
  findBestMatching(playerIds, (a, b) => prior.get(pairKey(a, b)) ?? 0);

const buildMatchups = (
  pairs: [string, string][],
  prior: Map<string, number>,
): [[string, string], [string, string]][] =>
  findBestMatching(pairs, (p1, p2) =>
    (prior.get(pairKey(p1[0], p2[0])) ?? 0) +
    (prior.get(pairKey(p1[0], p2[1])) ?? 0) +
    (prior.get(pairKey(p1[1], p2[0])) ?? 0) +
    (prior.get(pairKey(p1[1], p2[1])) ?? 0),
  );

// Pick which players sit out this round when the count isn't a multiple of 4.
// Rotate so everyone sits out roughly the same number of times.
const selectPlayingPlayers = (players: Player[], previousMatches: Match[]): Player[] => {
  const groupsOf4 = Math.floor(players.length / 4);
  const playingCount = groupsOf4 * 4;
  if (playingCount === players.length) return players;

  const sitOutCount = new Map<string, number>(players.map(p => [p.id, 0]));
  const rounds = new Set(previousMatches.map(m => m.round));
  for (const r of rounds) {
    const playedThisRound = new Set<string>();
    for (const m of previousMatches) {
      if (m.round !== r) continue;
      for (const id of [...m.team1, ...m.team2]) playedThisRound.add(id);
    }
    for (const p of players) {
      if (!playedThisRound.has(p.id)) {
        sitOutCount.set(p.id, (sitOutCount.get(p.id) ?? 0) + 1);
      }
    }
  }

  // Sit out the players who have sat out the fewest times so far (random tiebreak).
  const ranked = shuffleArray(players).sort(
    (a, b) => (sitOutCount.get(a.id) ?? 0) - (sitOutCount.get(b.id) ?? 0),
  );
  const sittingOut = new Set(ranked.slice(0, players.length - playingCount).map(p => p.id));
  return players.filter(p => !sittingOut.has(p.id));
};

export const generateRoundMatches = (
  players: Player[],
  round: number,
  previousMatches: Match[] = [],
): Match[] => {
  const playing = selectPlayingPlayers(players, previousMatches);
  if (playing.length < 4) return [];

  const pairs = buildPairs(playing.map(p => p.id), partnerCounts(previousMatches));
  const matchups = buildMatchups(pairs, opponentCounts(previousMatches));

  return matchups.map(([team1, team2], i) => ({
    id: generateId(),
    round,
    court: i + 1,
    team1,
    team2,
    completed: false,
  }));
};


export const getPlayerById = (players: Player[], id: string): Player | undefined => {
  return players.find(p => p.id === id);
};

export const calculateStandings = (players: Player[]): Player[] => {
  return [...players].sort((a, b) => {
    // Sort by wins first
    if (b.wins !== a.wins) return b.wins - a.wins;
    // Then by point difference
    const diffA = a.pointsFor - a.pointsAgainst;
    const diffB = b.pointsFor - b.pointsAgainst;
    if (diffB !== diffA) return diffB - diffA;
    // Then by points scored
    return b.pointsFor - a.pointsFor;
  });
};

type AmericanaRow = {
  id: string;
  code: string;
  data: Americana;
};

export const saveAmericana = async (americana: Americana): Promise<void> => {
  const payload: AmericanaRow = {
    id: americana.id,
    code: americana.code,
    data: americana,
  };

  const { error } = await supabase
    .from(AMERICANAS_TABLE)
    .upsert(payload, { onConflict: 'id' });

  if (error) {
    throw error;
  }
};

export const getStoredAmericanas = async (): Promise<Americana[]> => {
  const { data, error } = await supabase
    .from(AMERICANAS_TABLE)
    .select('data');

  if (error) {
    throw error;
  }

  return (data ?? []).map(row => row.data as Americana);
};

export const getAmericanaByCode = async (code: string): Promise<Americana | undefined> => {
  const { data, error } = await supabase
    .from(AMERICANAS_TABLE)
    .select('data')
    .eq('code', code.toUpperCase())
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.data as Americana | undefined;
};

export const getAmericanaById = async (id: string): Promise<Americana | undefined> => {
  const { data, error } = await supabase
    .from(AMERICANAS_TABLE)
    .select('data')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.data as Americana | undefined;
};
