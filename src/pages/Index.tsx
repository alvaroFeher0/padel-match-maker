import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { HomeView } from '@/components/HomeView';
import { CreateView } from '@/components/CreateView';
import { JoinView } from '@/components/JoinView';
import { LobbyView } from '@/components/LobbyView';
import { TournamentView } from '@/components/TournamentView';
import { Americana, AmericanaView } from '@/types/americana';
import { generateRoundMatches, saveAmericana, getAmericanaById } from '@/lib/americana';
import { supabase } from '@/lib/supabase';

const Index = () => {
  const [view, setView] = useState<AmericanaView>('home');
  const [currentAmericana, setCurrentAmericana] = useState<Americana | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');

  useEffect(() => {
    if (!currentAmericana) return;

    const channel = supabase
      .channel(`americana:${currentAmericana.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'americanas',
          filter: `id=eq.${currentAmericana.id}`,
        },
        async () => {
          try {
            const updated = await getAmericanaById(currentAmericana.id);
            if (updated) {
              setCurrentAmericana(updated);
              if (updated.status === 'playing') {
                setView('tournament');
              }
            }
          } catch (error) {
            console.error(error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentAmericana?.id]);

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

  const handleStartTournament = async () => {
    if (!currentAmericana) return;

    const matches = generateRoundMatches(currentAmericana.players, 1);
    currentAmericana.matches = matches;
    currentAmericana.currentRound = 1;
    currentAmericana.status = 'playing';

    try {
      await saveAmericana(currentAmericana);
    } catch (error) {
      console.error(error);
    }
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
