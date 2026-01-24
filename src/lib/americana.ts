import { Americana, Player, Match } from '@/types/americana';

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

export const generateRoundMatches = (players: Player[], round: number): Match[] => {
  const shuffledPlayers = shuffleArray(players);
  const matches: Match[] = [];
  
  // Create matches with 4 players each
  for (let i = 0; i < Math.floor(shuffledPlayers.length / 4); i++) {
    const matchPlayers = shuffledPlayers.slice(i * 4, (i + 1) * 4);
    matches.push({
      id: generateId(),
      round,
      court: i + 1,
      team1: [matchPlayers[0].id, matchPlayers[1].id],
      team2: [matchPlayers[2].id, matchPlayers[3].id],
      completed: false,
    });
  }
  
  return matches;
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

export const saveAmericana = (americana: Americana): void => {
  const stored = getStoredAmericanas();
  const index = stored.findIndex(a => a.id === americana.id);
  if (index >= 0) {
    stored[index] = americana;
  } else {
    stored.push(americana);
  }
  localStorage.setItem('americanas', JSON.stringify(stored));
};

export const getStoredAmericanas = (): Americana[] => {
  const stored = localStorage.getItem('americanas');
  return stored ? JSON.parse(stored) : [];
};

export const getAmericanaByCode = (code: string): Americana | undefined => {
  const stored = getStoredAmericanas();
  return stored.find(a => a.code.toUpperCase() === code.toUpperCase());
};

export const getAmericanaById = (id: string): Americana | undefined => {
  const stored = getStoredAmericanas();
  return stored.find(a => a.id === id);
};
