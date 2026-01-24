export interface Player {
  id: string;
  name: string;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
}

export interface Match {
  id: string;
  round: number;
  court: number;
  team1: [string, string]; // player IDs
  team2: [string, string]; // player IDs
  score1?: number;
  score2?: number;
  completed: boolean;
}

export interface Americana {
  id: string;
  code: string;
  name: string;
  adminId: string;
  players: Player[];
  matches: Match[];
  currentRound: number;
  totalRounds: number;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: string;
}

export type AmericanaView = 'home' | 'create' | 'join' | 'lobby' | 'tournament';
