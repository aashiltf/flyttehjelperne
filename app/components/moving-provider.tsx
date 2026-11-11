import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { emptyState, parseStoredState, type MovingState } from '~/lib/moving-plan';

const STORAGE_KEY = 'flyttehjelpen:v1';
type MovingContextValue = {
  state: MovingState;
  update: (change: (state: MovingState) => MovingState) => void;
  reset: () => void;
  ready: boolean;
  storageError: string;
};
const MovingContext = createContext<MovingContextValue | null>(null);

export function MovingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(emptyState);
  const current = useRef(state);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = parseStoredState(raw);
        current.current = saved;
        setState(saved);
      }
    } catch {
      setStorageError('Vi kunne ikke lese den lagrede planen. Du kan fortsette her, men tidligere svar er ikke hentet inn.');
    }
    setReady(true);
  }, []);

  function update(change: (state: MovingState) => MovingState) {
    const next = change(current.current);
    current.current = next;
    setState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setStorageError('');
    } catch {
      setStorageError('Svarene er beholdt på denne siden, men kunne ikke lagres i nettleseren. De kan gå tapt når du lukker eller oppdaterer siden.');
    }
  }

  function reset() {
    current.current = emptyState();
    setState(current.current);
    try {
      localStorage.removeItem(STORAGE_KEY);
      setStorageError('');
    } catch {
      setStorageError('Planen er nullstilt her, men vi kunne ikke slette nettleserens lagring. Tidligere data kan vises ved neste besøk.');
    }
  }

  return <MovingContext.Provider value={{ state, update, reset, ready, storageError }}>{children}</MovingContext.Provider>;
}

export function useMoving() {
  const context = useContext(MovingContext);
  if (!context) throw new Error('MovingProvider mangler');
  return context;
}
