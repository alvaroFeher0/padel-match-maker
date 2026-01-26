import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Americana } from '@/types/americana';
import { MatchCard } from '@/components/MatchCard';
import { StandingsTable } from '@/components/StandingsTable';
import { generateRoundMatches, saveAmericana } from '@/lib/americana';
import { ArrowRight, Trophy, RotateCcw, ListOrdered } from 'lucide-react';
import { toast } from 'sonner';

interface TournamentViewProps {
  americana: Americana;
  currentPlayerId: string;
  onUpdate: (americana: Americana) => void;
  onReset: () => void;
}

export const TournamentView = ({ americana, currentPlayerId, onUpdate, onReset }: TournamentViewProps) => {
  const [showStandings, setShowStandings] = useState(false);
  const isAdmin = americana.adminId === currentPlayerId;

  const currentRoundMatches = americana.matches.filter(m => m.round === americana.currentRound);
  const allCurrentMatchesComplete = currentRoundMatches.every(m => m.completed);
  const isLastRound = americana.currentRound === americana.totalRounds;
  const isTournamentFinished = americana.status === 'finished';

  const handleSetWinner = async (matchId: string, winnerTeam: 1 | 2) => {
    const match = americana.matches.find(m => m.id === matchId);
    if (!match) return;

    match.score1 = winnerTeam === 1 ? 1 : 0;
    match.score2 = winnerTeam === 2 ? 1 : 0;
    match.completed = true;

    // Update player stats
    const winningTeam = winnerTeam === 1 ? match.team1 : match.team2;
    const losingTeam = winnerTeam === 1 ? match.team2 : match.team1;

    winningTeam.forEach(playerId => {
      const player = americana.players.find(p => p.id === playerId);
      if (player) {
        player.wins++;
        player.pointsFor++;
      }
    });

    losingTeam.forEach(playerId => {
      const player = americana.players.find(p => p.id === playerId);
      if (player) {
        player.losses++;
        player.pointsAgainst++;
      }
    });

    try {
      await saveAmericana(americana);
      onUpdate({ ...americana });
      toast.success('¡Resultado registrado!');
      console.log('Match updated:', match);
    } catch (error) {
      console.error(error);
      toast.error('No se pudo guardar el resultado', {
        description: 'Inténtalo de nuevo en unos segundos',
      });
    }
  };

  const handleNextRound = async () => {
    if (isLastRound) {
      americana.status = 'finished';
      try {
        await saveAmericana(americana);
        onUpdate({ ...americana });
        toast.success('¡Torneo finalizado!');
      } catch (error) {
        console.error(error);
        toast.error('No se pudo finalizar el torneo', {
          description: 'Inténtalo de nuevo en unos segundos',
        });
      }
      return;
    }

    const newRound = americana.currentRound + 1;
    const newMatches = generateRoundMatches(americana.players, newRound);
    americana.matches.push(...newMatches);
    americana.currentRound = newRound;

    try {
      await saveAmericana(americana);
      onUpdate({ ...americana });
      console.log('New round matches generated:', newMatches);
      toast.success(`¡Ronda ${newRound} iniciada!`);
    } catch (error) {
      console.error(error);
      toast.error('No se pudo iniciar la ronda', {
        description: 'Inténtalo de nuevo en unos segundos',
      });
    }
  };

  if (isTournamentFinished) {
    return (
      <div className="min-h-screen flex flex-col p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center text-center"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Trophy className="w-20 h-20 text-yellow-500 mb-6" />
          </motion.div>
          
          <h1 className="text-3xl font-black mb-2">¡Torneo Finalizado!</h1>
          <p className="text-muted-foreground mb-8">{americana.name}</p>

          <div className="w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Clasificación Final</h2>
            <StandingsTable players={americana.players} currentPlayerId={currentPlayerId} />
          </div>

          {isAdmin && (
            <Button
              variant="outline"
              size="lg"
              onClick={onReset}
              className="mt-8"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Nueva Americana
            </Button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-xl font-bold">{americana.name}</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-muted-foreground">
            Ronda {americana.currentRound} de {americana.totalRounds}
          </span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(americana.currentRound / americana.totalRounds) * 100}%` }}
              className="h-full gradient-primary"
            />
          </div>
        </div>
      </motion.div>

      {/* Tab buttons */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={!showStandings ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowStandings(false)}
          className="flex-1"
        >
          Partidos
        </Button>
        <Button
          variant={showStandings ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowStandings(true)}
          className="flex-1"
        >
          <ListOrdered className="w-4 h-4 mr-1" />
          Clasificación
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          {showStandings ? (
            <motion.div
              key="standings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <StandingsTable players={americana.players} currentPlayerId={currentPlayerId} />
            </motion.div>
          ) : (
            <motion.div
              key="matches"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {currentRoundMatches.map((match, index) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  players={americana.players}
                  isAdmin={isAdmin}
                  onSetWinner={handleSetWinner}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Next round button */}
      {isAdmin && allCurrentMatchesComplete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <Button
            variant="hero"
            size="xl"
            onClick={handleNextRound}
            className="w-full"
          >
            {isLastRound ? (
              <>
                <Trophy className="w-6 h-6" />
                Finalizar Torneo
              </>
            ) : (
              <>
                Siguiente Ronda
                <ArrowRight className="w-6 h-6" />
              </>
            )}
          </Button>
        </motion.div>
      )}

      {!isAdmin && !allCurrentMatchesComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
            <div className="w-2 h-2 rounded-full bg-energy-orange animate-pulse" />
            <span className="text-sm text-muted-foreground">
              Partidos en curso...
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};
