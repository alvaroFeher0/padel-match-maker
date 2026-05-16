import { describe, it, expect } from "vitest";
import { generateRoundMatches, createPlayer } from "@/lib/americana";
import type { Match } from "@/types/americana";

const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

const simulate = (playerCount: number, rounds: number) => {
  const players = Array.from({ length: playerCount }, (_, i) => createPlayer(`P${i + 1}`));
  const matches: Match[] = [];
  for (let r = 1; r <= rounds; r++) {
    matches.push(...generateRoundMatches(players, r, matches));
  }
  return { players, matches };
};

const partnerRepeatCount = (matches: Match[]) => {
  const seen = new Map<string, number>();
  for (const m of matches) {
    for (const team of [m.team1, m.team2]) {
      const k = pairKey(team[0], team[1]);
      seen.set(k, (seen.get(k) ?? 0) + 1);
    }
  }
  let repeats = 0;
  for (const c of seen.values()) if (c > 1) repeats += c - 1;
  return repeats;
};

describe("generateRoundMatches", () => {
  it("no partner repeats for 4 players over 3 rounds (full round-robin)", () => {
    const { matches } = simulate(4, 3);
    expect(partnerRepeatCount(matches)).toBe(0);
  });

  it("no partner repeats for 8 players over 7 rounds (full round-robin)", () => {
    const { matches } = simulate(8, 7);
    expect(partnerRepeatCount(matches)).toBe(0);
  });

  it("no partner repeats for 12 players over 11 rounds", () => {
    const { matches } = simulate(12, 11);
    expect(partnerRepeatCount(matches)).toBe(0);
  });

  it("rotates sit-outs fairly when player count isn't divisible by 4", () => {
    const { players, matches } = simulate(6, 6);
    const games = new Map<string, number>(players.map(p => [p.id, 0]));
    for (const m of matches) {
      for (const id of [...m.team1, ...m.team2]) {
        games.set(id, (games.get(id) ?? 0) + 1);
      }
    }
    const counts = [...games.values()];
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });

  it("degrades gracefully when running beyond a full round-robin", () => {
    const { matches } = simulate(8, 14);
    // 14 rounds × 2 matches × 2 teams = 56 partnerships across 28 possible distinct pairs
    // each pair should appear exactly twice — i.e. all "repeats" are forced minimum
    expect(partnerRepeatCount(matches)).toBe(28);
  });
});

// Dumps full schedules to the console so you can eyeball the pairings.
// Bump the entries in `samples` or add new ones to inspect other sizes.
describe("schedule dump", () => {
  const samples: Array<{ players: number; rounds: number }> = [
    { players: 4, rounds: 3 },
    { players: 8, rounds: 7 },
    { players: 12, rounds: 11 },
    { players: 6, rounds: 5 },
  ];

  for (const { players, rounds } of samples) {
    it(`${players} players × ${rounds} rounds`, () => {
      const { players: roster, matches } = simulate(players, rounds);
      const nameById = new Map(roster.map(p => [p.id, p.name]));
      const lines: string[] = [`\n=== ${players} players × ${rounds} rounds ===`];
      for (let r = 1; r <= rounds; r++) {
        lines.push(`Round ${r}`);
        const roundMatches = matches.filter(m => m.round === r);
        const playing = new Set<string>();
        for (const m of roundMatches) {
          const t1 = m.team1.map(id => nameById.get(id)).join("+");
          const t2 = m.team2.map(id => nameById.get(id)).join("+");
          lines.push(`  Court ${m.court}: ${t1.padEnd(7)} vs ${t2}`);
          for (const id of [...m.team1, ...m.team2]) playing.add(id);
        }
        const sittingOut = roster.filter(p => !playing.has(p.id)).map(p => p.name);
        if (sittingOut.length) lines.push(`  Sitting out: ${sittingOut.join(", ")}`);
      }
      lines.push(`Total partner repeats: ${partnerRepeatCount(matches)}`);
      console.log(lines.join("\n"));
    });
  }
});
