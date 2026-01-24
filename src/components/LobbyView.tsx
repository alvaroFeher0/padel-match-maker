import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Play, Users, Crown } from 'lucide-react';
import { Americana } from '@/types/americana';
import { toast } from 'sonner';

interface LobbyViewProps {
  americana: Americana;
  currentPlayerId: string;
  onBack: () => void;
  onStart: () => void;
}

export const LobbyView = ({ americana, currentPlayerId, onBack, onStart }: LobbyViewProps) => {
  const isAdmin = americana.adminId === currentPlayerId;
  const canStart = americana.players.length >= 4 && americana.players.length % 4 === 0;

  const copyCode = () => {
    navigator.clipboard.writeText(americana.code);
    toast.success('¡Código copiado!');
  };

  return (
    <div className="min-h-screen flex flex-col p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-4 mb-6"
      >
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">{americana.name}</h1>
          <p className="text-sm text-muted-foreground">Sala de espera</p>
        </div>
      </motion.div>

      {/* Code card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="gradient-primary rounded-2xl p-6 text-center mb-6 shadow-glow-primary"
      >
        <p className="text-primary-foreground/80 text-sm mb-2">Comparte este código</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-4xl font-black tracking-widest text-primary-foreground font-mono">
            {americana.code}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={copyCode}
            className="text-primary-foreground hover:bg-white/20"
          >
            <Copy className="w-5 h-5" />
          </Button>
        </div>
      </motion.div>

      {/* Players list */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-1"
      >
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">
            Jugadores ({americana.players.length})
          </h2>
        </div>

        <div className="space-y-3">
          {americana.players.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className={`flex items-center gap-3 p-4 rounded-xl ${
                player.id === currentPlayerId
                  ? 'gradient-card border-2 border-primary'
                  : 'bg-card border border-border'
              }`}
            >
              <div className="w-10 h-10 rounded-full gradient-dark flex items-center justify-center text-white font-bold">
                {player.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium flex-1">{player.name}</span>
              {player.id === americana.adminId && (
                <Crown className="w-5 h-5 text-energy-orange" />
              )}
              {player.id === currentPlayerId && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                  Tú
                </span>
              )}
            </motion.div>
          ))}
        </div>

        {americana.players.length < 4 && (
          <p className="text-center text-muted-foreground mt-6 text-sm">
            Se necesitan al menos 4 jugadores
          </p>
        )}

        {americana.players.length >= 4 && americana.players.length % 4 !== 0 && (
          <p className="text-center text-muted-foreground mt-6 text-sm">
            El número de jugadores debe ser múltiplo de 4
          </p>
        )}
      </motion.div>

      {/* Start button (admin only) */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <Button
            variant="hero"
            size="xl"
            onClick={onStart}
            disabled={!canStart}
            className="w-full"
          >
            <Play className="w-6 h-6" />
            Comenzar Torneo
          </Button>
        </motion.div>
      )}

      {!isAdmin && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-sm text-muted-foreground">
              Esperando a que el admin inicie...
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};
