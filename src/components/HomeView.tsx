import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PadelBall } from '@/components/PadelBall';
import { Plus, Users } from 'lucide-react';

interface HomeViewProps {
  onCreateClick: () => void;
  onJoinClick: () => void;
}

export const HomeView = ({ onCreateClick, onJoinClick }: HomeViewProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex flex-col items-center text-center max-w-md w-full"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="mb-6"
        >
          <PadelBall size="lg" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-black text-foreground mb-2"
        >
          Padel
          <span className="text-gradient-primary"> Americana</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground text-lg mb-12"
        >
          Organiza torneos fácil y rápido
        </motion.p>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col gap-4 w-full"
        >
          <Button
            variant="hero"
            size="xl"
            onClick={onCreateClick}
            className="w-full"
          >
            <Plus className="w-6 h-6" />
            Crear Americana
          </Button>

          <Button
            variant="outline"
            size="xl"
            onClick={onJoinClick}
            className="w-full"
          >
            <Users className="w-6 h-6" />
            Unirse a Americana
          </Button>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12 text-sm text-muted-foreground"
        >
          Sin registro · 100% gratis
        </motion.p>
      </motion.div>
    </div>
  );
};
