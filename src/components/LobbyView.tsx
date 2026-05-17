import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Copy, Play, Users, Crown, Share2, UserPlus, X } from 'lucide-react';
import { Americana } from '@/types/americana';
import { createPlayer, saveAmericana } from '@/lib/americana';
import { toast } from 'sonner';

interface LobbyViewProps {
  americana: Americana;
  currentPlayerId: string;
  onBack: () => void;
  onStart: () => void;
  onUpdate: (americana: Americana) => void;
}

export const LobbyView = ({ americana, currentPlayerId, onBack, onStart, onUpdate }: LobbyViewProps) => {
  const isAdmin = americana.adminId === currentPlayerId;
  const canStart = americana.players.length >= 4 && americana.players.length % 4 === 0;
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleAddPlayer = async () => {
    const name = newPlayerName.trim();
    if (!name || isAdding) return;

    const duplicate = americana.players.find(
      p => p.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) {
      toast.error('Nombre ya en uso');
      return;
    }

    setIsAdding(true);
    const player = createPlayer(name);
    americana.players.push(player);

    try {
      await saveAmericana(americana);
      onUpdate({ ...americana });
      setNewPlayerName('');
      toast.success(`${name} añadido`);
    } catch (error) {
      console.error(error);
      americana.players.pop();
      toast.error('No se pudo añadir el jugador');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (playerId === americana.adminId) return;
    const idx = americana.players.findIndex(p => p.id === playerId);
    if (idx === -1) return;

    setRemovingId(playerId);
    const [removed] = americana.players.splice(idx, 1);

    try {
      await saveAmericana(americana);
      onUpdate({ ...americana });
      toast.success(`${removed.name} eliminado`);
    } catch (error) {
      console.error(error);
      americana.players.splice(idx, 0, removed);
      toast.error('No se pudo eliminar el jugador');
    } finally {
      setRemovingId(null);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(americana.code);
    toast.success('¡Código copiado!');
  };

  const buildShareUrl = () =>
    `${window.location.origin}${window.location.pathname}?join=${americana.code}`;

  const shareLink = async () => {
    const url = buildShareUrl();
    const shareData = {
      title: 'Únete a la Americana',
      text: `Únete a "${americana.name}" en Padel Americana`,
      url,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // user cancelled or share failed — fall through to clipboard
        if ((err as Error).name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('¡Enlace copiado!');
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
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
        <Button
          variant="ghost"
          onClick={shareLink}
          className="mt-3 text-primary-foreground hover:bg-white/20 gap-2"
        >
          <Share2 className="w-4 h-4" />
          Compartir enlace
        </Button>
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

        {isAdmin && (
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Añadir jugador por nombre"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddPlayer();
              }}
              className="h-12 rounded-xl"
            />
            <Button
              variant="default"
              size="icon"
              onClick={handleAddPlayer}
              disabled={!newPlayerName.trim() || isAdding}
              className="h-12 w-12 rounded-xl shrink-0"
            >
              <UserPlus className="w-5 h-5" />
            </Button>
          </div>
        )}

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
              {isAdmin && player.id !== americana.adminId && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemovePlayer(player.id)}
                  disabled={removingId === player.id}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  aria-label={`Eliminar a ${player.name}`}
                >
                  <X className="w-4 h-4" />
                </Button>
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
