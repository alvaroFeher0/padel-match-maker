import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, LogIn } from 'lucide-react';
import { getAmericanaByCode, createPlayer, saveAmericana } from '@/lib/americana';
import { Americana } from '@/types/americana';
import { toast } from 'sonner';

interface JoinViewProps {
  onBack: () => void;
  onJoined: (americana: Americana, playerId: string) => void;
  initialCode?: string;
}

export const JoinView = ({ onBack, onJoined, initialCode = '' }: JoinViewProps) => {
  const [code, setCode] = useState(initialCode);
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    if (!code.trim() || !playerName.trim()) return;

    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const americana = await getAmericanaByCode(code.trim());

      if (!americana) {
        toast.error('Código no encontrado', {
          description: 'Revisa el código e inténtalo de nuevo',
        });
        setIsLoading(false);
        return;
      }

      if (americana.status !== 'waiting') {
        toast.error('Torneo ya comenzado', {
          description: 'No puedes unirte a un torneo que ya ha empezado',
        });
        setIsLoading(false);
        return;
      }

      const existingPlayer = americana.players.find(
        p => p.name.toLowerCase() === playerName.trim().toLowerCase()
      );

      if (existingPlayer) {
        toast.error('Nombre ya en uso', {
          description: 'Ya hay un jugador con ese nombre',
        });
        setIsLoading(false);
        return;
      }

      const player = createPlayer(playerName.trim());
      americana.players.push(player);
      await saveAmericana(americana);

      setIsLoading(false);
      onJoined(americana, player.id);
    } catch (error) {
      console.error(error);
      toast.error('No se pudo unirse', {
        description: 'Inténtalo de nuevo en unos segundos',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-4 mb-8"
      >
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-bold">Unirse a Americana</h1>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 flex flex-col gap-6 max-w-md mx-auto w-full"
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Código del torneo
          </label>
          <Input
            placeholder="Ej: ABC123"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="h-14 text-lg rounded-xl uppercase tracking-widest text-center font-mono"
            maxLength={6}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Tu nombre
          </label>
          <Input
            placeholder="¿Cómo te llamas?"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="h-14 text-lg rounded-xl"
          />
        </div>

        <div className="flex-1" />

        <Button
          variant="hero"
          size="xl"
          onClick={handleJoin}
          disabled={!code.trim() || !playerName.trim() || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <LogIn className="w-6 h-6" />
              Unirse
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
};
