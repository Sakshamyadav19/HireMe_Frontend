import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface MatchResultsContextValue {
  totalMatches: number | null;
  setTotalMatches: (n: number | null) => void;
  /** In-flight match job id; persists across tab switch so UI can show loader or results when returning. */
  currentJobId: string | null;
  setCurrentJobId: (id: string | null) => void;
}

const MatchResultsContext = createContext<MatchResultsContextValue | null>(null);

export function MatchResultsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [totalMatches, setTotalMatchesState] = useState<number | null>(null);
  const [currentJobId, setCurrentJobIdState] = useState<string | null>(null);
  const setTotalMatches = useCallback((n: number | null) => {
    setTotalMatchesState(n);
  }, []);
  const setCurrentJobId = useCallback((id: string | null) => {
    setCurrentJobIdState(id);
  }, []);

  useEffect(() => {
    if (!user) {
      setTotalMatchesState(null);
      setCurrentJobIdState(null);
    }
  }, [user]);

  return (
    <MatchResultsContext.Provider value={{ totalMatches, setTotalMatches, currentJobId, setCurrentJobId }}>
      {children}
    </MatchResultsContext.Provider>
  );
}

export function useMatchResults(): MatchResultsContextValue {
  const ctx = useContext(MatchResultsContext);
  if (!ctx) {
    throw new Error("useMatchResults must be used within MatchResultsProvider");
  }
  return ctx;
}
