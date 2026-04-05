import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';

import ScoringRulesModal from './ScoringRulesModal';

const ScoringRulesModalContext = createContext(null);

/**
 * Opens/closes the app-wide scoring rules modal (primary surface for rules copy).
 * Deep link: any dashboard URL with `?scoringRules=1` (query stripped after open).
 */
export function useScoringRulesModal() {
  const ctx = useContext(ScoringRulesModalContext);
  if (!ctx) {
    throw new Error(
      'useScoringRulesModal must be used within ScoringRulesModalProvider (dashboard shell)'
    );
  }
  return ctx;
}

export function ScoringRulesModalProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const openScoringRules = useCallback(() => setOpen(true), []);
  const closeScoringRules = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (searchParams.get('scoringRules') !== '1') return;
    setOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete('scoringRules');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const value = useMemo(
    () => ({ openScoringRules, closeScoringRules }),
    [openScoringRules, closeScoringRules]
  );

  return (
    <ScoringRulesModalContext.Provider value={value}>
      {children}
      <ScoringRulesModal open={open} onClose={closeScoringRules} />
    </ScoringRulesModalContext.Provider>
  );
}
