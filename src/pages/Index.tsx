import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { HomeView } from '@/components/HomeView';
import { CreateView } from '@/components/CreateView';
import { JoinView } from '@/components/JoinView';
import { LobbyView } from '@/components/LobbyView';
import { TournamentView } from '@/components/TournamentView';
import { Americana, AmericanaView } from '@/types/americana';
import { generateRoundMatches, saveAmericana, getAmericanaById } from '@/lib/americana';

const Index = () => {
  const [view, setView] = useState<AmericanaView>('home');
  const [currentAmericana, setCurrentAmericana] = useState<Americana | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');

  // Poll for updates when in lobby (to see new players joining)
  useEffect(() => {
    if (view === 'lobby' && currentAmericana) {
      const interval = setInterval(() => {
        const updated = getAmericanaById(currentAmericana.id);
        if (updated) {
          setCurrentAmericana(updated);
          if (updated.status === 'playing') {
            setView('tournament');
          }
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [view, currentAmericana?.id]);

  const handleCreated = (americana: Americana, playerId: string) => {
    setCurrentAmericana(americana);
    setCurrentPlayerId(playerId);
    setView('lobby');
  };

  const handleJoined = (americana: Americana, playerId: string) => {
    setCurrentAmericana(americana);
    setCurrentPlayerId(playerId);
    setView('lobby');
  };

  const handleStartTournament = () => {
    if (!currentAmericana) return;

    const matches = generateRoundMatches(currentAmericana.players, 1);
    currentAmericana.matches = matches;
    currentAmericana.currentRound = 1;
    currentAmericana.status = 'playing';

    saveAmericana(currentAmericana);
    setCurrentAmericana({ ...currentAmericana });
    setView('tournament');
  };

  const handleUpdateAmericana = (americana: Americana) => {
    setCurrentAmericana(americana);
  };

  const handleReset = () => {
    setCurrentAmericana(null);
    setCurrentPlayerId('');
    setView('home');
  };

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {view === 'home' && (
          <HomeView
            key="home"
            onCreateClick={() => setView('create')}
            onJoinClick={() => setView('join')}
          />
        )}

        {view === 'create' && (
          <CreateView
            key="create"
            onBack={() => setView('home')}
            onCreated={handleCreated}
          />
        )}

        {view === 'join' && (
          <JoinView
            key="join"
            onBack={() => setView('home')}
            onJoined={handleJoined}
          />
        )}

        {view === 'lobby' && currentAmericana && (
          <LobbyView
            key="lobby"
            americana={currentAmericana}
            currentPlayerId={currentPlayerId}
            onBack={handleReset}
            onStart={handleStartTournament}
          />
        )}

        {view === 'tournament' && currentAmericana && (
          <TournamentView
            key="tournament"
            americana={currentAmericana}
            currentPlayerId={currentPlayerId}
            onUpdate={handleUpdateAmericana}
            onReset={handleReset}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
