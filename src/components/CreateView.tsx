import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Rocket } from 'lucide-react';
import { generateCode, generateId, createPlayer, saveAmericana } from '@/lib/americana';
import { Americana } from '@/types/americana';
import { toast } from 'sonner';

interface CreateViewProps {
  onBack: () => void;
  onCreated: (americana: Americana, playerId: string) => void;
}

export const CreateView = ({ onBack, onCreated }: CreateViewProps) => {
  const [tournamentName, setTournamentName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [rounds, setRounds] = useState(4);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!tournamentName.trim() || !adminName.trim()) return;

    setIsLoading(true);

    const admin = createPlayer(adminName.trim());
    const americana: Americana = {
      id: generateId(),
      code: generateCode(),
      name: tournamentName.trim(),
      adminId: admin.id,
      players: [admin],
      matches: [],
      currentRound: 0,
      totalRounds: rounds,
      status: 'waiting',
      createdAt: new Date().toISOString(),
    };

    try {
      await saveAmericana(americana);

      await new Promise(resolve => setTimeout(resolve, 500));
      setIsLoading(false);
      onCreated(americana, admin.id);
    } catch (error) {
      console.error(error);
      toast.error('No se pudo crear el torneo', {
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
        <h1 className="text-2xl font-bold">Crear Americana</h1>
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
            Nombre del torneo
          </label>
          <Input
            placeholder="Ej: Americana del Domingo"
            value={tournamentName}
            onChange={(e) => setTournamentName(e.target.value)}
            className="h-14 text-lg rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Tu nombre
          </label>
          <Input
            placeholder="¿Cómo te llamas?"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            className="h-14 text-lg rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Número de rondas
          </label>
          <div className="flex gap-3">
            {[3, 4, 5, 6].map((num) => (
              <Button
                key={num}
                variant={rounds === num ? 'default' : 'outline'}
                size="lg"
                onClick={() => setRounds(num)}
                className="flex-1 h-14 text-lg rounded-xl"
              >
                {num}
              </Button>
            ))}
          </div>
        </div>

        {/* Player requirements info */}
        <div className="bg-muted/50 rounded-xl p-4 space-y-2">
          <p className="text-sm font-medium text-foreground">
            Jugadores necesarios
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Mínimo:</span>
              <span className="font-semibold text-foreground">4 jugadores</span>
            </div>
            <div className="flex justify-between">
              <span>Recomendado:</span>
              <span className="font-semibold text-foreground">8 jugadores</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            💡 Los jugadores deben ser múltiplos de 4 (4, 8, 12, 16...). 
            Con más jugadores, más variedad en los emparejamientos.
          </p>
        </div>

        <div className="flex-1" />

        <Button
          variant="hero"
          size="xl"
          onClick={handleCreate}
          disabled={!tournamentName.trim() || !adminName.trim() || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Rocket className="w-6 h-6" />
              Crear Torneo
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
};
