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

const SESSION_KEY = 'padelAmericana.session';

type StoredSession = { americanaId: string; playerId: string };

const readSession = (): StoredSession | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.americanaId || !parsed?.playerId) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeSession = (session: StoredSession) => {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // storage may be unavailable (private mode, quota) — silently ignore
  }
};

const clearSession = () => {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
};

const Index = () => {
  const [view, setView] = useState<AmericanaView>('home');
  const [currentAmericana, setCurrentAmericana] = useState<Americana | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');
  const [initialJoinCode, setInitialJoinCode] = useState<string>('');
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('join');
    if (code) {
      setInitialJoinCode(code.toUpperCase());
      setView('join');
      const url = new URL(window.location.href);
      url.searchParams.delete('join');
      window.history.replaceState({}, '', url.toString());
      setIsRestoring(false);
      return;
    }

    const session = readSession();
    if (!session) {
      setIsRestoring(false);
      return;
    }

    (async () => {
      try {
        const americana = await getAmericanaById(session.americanaId);
        const stillAPlayer = americana?.players.some(p => p.id === session.playerId);
        if (!americana || !stillAPlayer) {
          clearSession();
          return;
        }
        setCurrentAmericana(americana);
        setCurrentPlayerId(session.playerId);
        setView(americana.status === 'waiting' ? 'lobby' : 'tournament');
      } catch (error) {
        console.error('Failed to restore session', error);
      } finally {
        setIsRestoring(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!currentAmericana || !currentPlayerId) return;
    writeSession({ americanaId: currentAmericana.id, playerId: currentPlayerId });
  }, [currentAmericana?.id, currentPlayerId]);

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
    clearSession();
    setCurrentAmericana(null);
    setCurrentPlayerId('');
    setView('home');
  };

  if (isRestoring) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

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
            initialCode={initialJoinCode}
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
            onUpdate={handleUpdateAmericana}
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
