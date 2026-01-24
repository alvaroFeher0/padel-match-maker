import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Match, Player } from '@/types/americana';
import { getPlayerById } from '@/lib/americana';
import { Check, Trophy } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  players: Player[];
  isAdmin: boolean;
  onSetWinner: (matchId: string, winnerTeam: 1 | 2) => void;
}

export const MatchCard = ({ match, players, isAdmin, onSetWinner }: MatchCardProps) => {
  const [selectedWinner, setSelectedWinner] = useState<1 | 2 | null>(null);

  const team1Players = match.team1.map(id => getPlayerById(players, id)!);
  const team2Players = match.team2.map(id => getPlayerById(players, id)!);

  const handleConfirmWinner = () => {
    if (selectedWinner) {
      onSetWinner(match.id, selectedWinner);
    }
  };

  if (match.completed) {
    const winnerTeam = match.score1! > match.score2! ? 1 : 2;
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-4 opacity-75"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">
            Pista {match.court}
          </span>
          <div className="flex items-center gap-1 text-primary">
            <Check className="w-4 h-4" />
            <span className="text-xs font-medium">Finalizado</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className={`flex items-center justify-between p-2 rounded-lg ${winnerTeam === 1 ? 'bg-primary/10 border border-primary/30' : ''}`}>
            <div className="flex items-center gap-2">
              {winnerTeam === 1 && <Trophy className="w-4 h-4 text-primary" />}
              <span className={`text-sm ${winnerTeam === 1 ? 'font-semibold' : ''}`}>
                {team1Players.map(p => p.name).join(' & ')}
              </span>
            </div>
          </div>

          <div className={`flex items-center justify-between p-2 rounded-lg ${winnerTeam === 2 ? 'bg-primary/10 border border-primary/30' : ''}`}>
            <div className="flex items-center gap-2">
              {winnerTeam === 2 && <Trophy className="w-4 h-4 text-primary" />}
              <span className={`text-sm ${winnerTeam === 2 ? 'font-semibold' : ''}`}>
                {team2Players.map(p => p.name).join(' & ')}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="gradient-card border border-border rounded-xl p-4 shadow-md"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-muted-foreground">
          Pista {match.court}
        </span>
        <div className="w-2 h-2 rounded-full bg-energy-orange animate-pulse" />
      </div>

      <div className="space-y-3">
        <button
          onClick={() => isAdmin && setSelectedWinner(1)}
          disabled={!isAdmin}
          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
            selectedWinner === 1
              ? 'gradient-primary text-primary-foreground shadow-glow-primary'
              : 'bg-muted hover:bg-muted/80'
          } ${!isAdmin ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <span className="font-medium">
            {team1Players.map(p => p.name).join(' & ')}
          </span>
          {selectedWinner === 1 && <Trophy className="w-5 h-5" />}
        </button>

        <div className="text-center text-xs font-medium text-muted-foreground">VS</div>

        <button
          onClick={() => isAdmin && setSelectedWinner(2)}
          disabled={!isAdmin}
          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
            selectedWinner === 2
              ? 'gradient-primary text-primary-foreground shadow-glow-primary'
              : 'bg-muted hover:bg-muted/80'
          } ${!isAdmin ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <span className="font-medium">
            {team2Players.map(p => p.name).join(' & ')}
          </span>
          {selectedWinner === 2 && <Trophy className="w-5 h-5" />}
        </button>
      </div>

      {isAdmin && selectedWinner && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4"
        >
          <Button
            variant="accent"
            size="lg"
            onClick={handleConfirmWinner}
            className="w-full"
          >
            Confirmar ganador
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};
