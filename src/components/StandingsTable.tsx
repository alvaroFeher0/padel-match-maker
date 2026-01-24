import { motion } from 'framer-motion';
import { Player } from '@/types/americana';
import { calculateStandings } from '@/lib/americana';
import { Trophy, Medal } from 'lucide-react';

interface StandingsTableProps {
  players: Player[];
  currentPlayerId: string;
}

export const StandingsTable = ({ players, currentPlayerId }: StandingsTableProps) => {
  const standings = calculateStandings(players);

  const getPositionIcon = (position: number) => {
    if (position === 0) return <Trophy className="w-5 h-5 text-energy-orange" />;
    if (position === 1) return <Medal className="w-5 h-5 text-muted-foreground" />;
    if (position === 2) return <Medal className="w-5 h-5 text-primary" />;
    return <span className="w-5 text-center font-bold text-muted-foreground">{position + 1}</span>;
  };

  return (
    <div className="space-y-2">
      {standings.map((player, index) => (
        <motion.div
          key={player.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`flex items-center gap-3 p-3 rounded-xl ${
            player.id === currentPlayerId
              ? 'gradient-card border-2 border-primary'
              : 'bg-card border border-border'
          }`}
        >
          <div className="w-8 flex items-center justify-center">
            {getPositionIcon(index)}
          </div>
          
          <div className="flex-1">
            <p className="font-semibold text-sm">
              {player.name}
              {player.id === currentPlayerId && (
                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Tú
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <p className="font-bold text-primary">{player.wins}</p>
              <p className="text-xs text-muted-foreground">V</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-muted-foreground">{player.losses}</p>
              <p className="text-xs text-muted-foreground">D</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
