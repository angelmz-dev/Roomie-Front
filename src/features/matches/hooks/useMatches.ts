import { useCallback, useEffect, useRef, useState } from "react";
import { ApiClientError } from "../../../lib/api-error";
import { useAuth } from "../../auth/hooks/useAuth";
import { getMyMatches } from "../services/matches.service";
import type { MatchItem, MatchesStatus } from "../types/matches.types";

function deduplicateMatches(
  incoming: readonly MatchItem[],
  currentUserId: string,
): MatchItem[] {
  const seen = new Set<string>();
  const result: MatchItem[] = [];

  for (const item of incoming) {
    if (
      !item.matchId ||
      seen.has(item.matchId) ||
      item.matchedUser.id === currentUserId
    ) {
      continue;
    }

    seen.add(item.matchId);
    result.push(item);
  }

  return result;
}

interface InternalMatchesState {
  ownerUserId: string | null;
  status: MatchesStatus;
  matches: MatchItem[];
  error: string | null;
  refreshError: string | null;
}

const INITIAL_STATE: InternalMatchesState = {
  ownerUserId: null,
  status: "loading",
  matches: [],
  error: null,
  refreshError: null,
};

export interface UseMatchesResult {
  status: MatchesStatus;
  matches: MatchItem[];
  error: string | null;
  refreshError: string | null;
  isRefreshing: boolean;
  refreshMatches: () => Promise<void>;
}

export function useMatches(): UseMatchesResult {
  const { isAuthenticated, user } = useAuth();
  const activeUserId = isAuthenticated && user ? user.id : null;

  const [state, setState] = useState<InternalMatchesState>(INITIAL_STATE);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const activeUserIdRef = useRef<string | null>(activeUserId);
  const sessionGenerationRef = useRef<number>(0);
  const requestVersionRef = useRef<number>(0);
  const fetchingRef = useRef<boolean>(false);

  const executeMatchesFetch = useCallback(
    async (options: {
      targetUserId: string;
      sessionGeneration: number;
      requestVersion: number;
      isCancelledCheck?: () => boolean;
      isManualRefresh?: boolean;
    }): Promise<void> => {
      fetchingRef.current = true;

      try {
        const response = await getMyMatches();

        if (
          options.isCancelledCheck?.() ||
          activeUserIdRef.current !== options.targetUserId ||
          sessionGenerationRef.current !== options.sessionGeneration ||
          requestVersionRef.current !== options.requestVersion
        ) {
          return;
        }

        const deduped = deduplicateMatches(response.data, options.targetUserId);

        setState({
          ownerUserId: options.targetUserId,
          status: deduped.length > 0 ? "ready" : "empty",
          matches: deduped,
          error: null,
          refreshError: null,
        });
      } catch (err: unknown) {
        if (
          options.isCancelledCheck?.() ||
          activeUserIdRef.current !== options.targetUserId ||
          sessionGenerationRef.current !== options.sessionGeneration ||
          requestVersionRef.current !== options.requestVersion
        ) {
          return;
        }

        if (
          err instanceof ApiClientError &&
          err.kind === "http" &&
          err.status === 401
        ) {
          // Axios interceptor handles active session invalidation
          return;
        }

        const message =
          err instanceof ApiClientError
            ? err.message
            : "No se pudieron cargar tus coincidencias. Intenta nuevamente.";

        setState((prev) => {
          // Preserve previously loaded matches if a manual refresh fails
          const hasLoadedListForUser =
            prev.ownerUserId === options.targetUserId &&
            prev.matches.length > 0;

          if (options.isManualRefresh && hasLoadedListForUser) {
            return {
              ...prev,
              status: "ready",
              error: null,
              refreshError: message,
            };
          }

          return {
            ownerUserId: options.targetUserId,
            status: "error",
            matches: [],
            error: message,
            refreshError: null,
          };
        });
      } finally {
        if (
          sessionGenerationRef.current === options.sessionGeneration &&
          requestVersionRef.current === options.requestVersion
        ) {
          fetchingRef.current = false;
          setIsRefreshing(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    activeUserIdRef.current = activeUserId;
    const nextGeneration = ++sessionGenerationRef.current;
    fetchingRef.current = false;

    if (!activeUserId) {
      requestVersionRef.current += 1;
      return;
    }

    let isCancelled = false;
    const requestVersion = ++requestVersionRef.current;

    void executeMatchesFetch({
      targetUserId: activeUserId,
      sessionGeneration: nextGeneration,
      requestVersion,
      isCancelledCheck: () => isCancelled,
    });

    return () => {
      isCancelled = true;
      sessionGenerationRef.current += 1;
      requestVersionRef.current += 1;
    };
  }, [activeUserId, executeMatchesFetch]);

  const effectiveState =
    activeUserId && state.ownerUserId === activeUserId
      ? state
      : {
          ownerUserId: activeUserId,
          status: "loading" as MatchesStatus,
          matches: [] as MatchItem[],
          error: null as string | null,
          refreshError: null as string | null,
        };

  const refreshMatches = useCallback(async (): Promise<void> => {
    const targetUserId = activeUserIdRef.current;
    if (!targetUserId || fetchingRef.current) {
      return;
    }

    const sessionGeneration = sessionGenerationRef.current;
    const requestVersion = ++requestVersionRef.current;

    setIsRefreshing(true);
    setState((prev) => {
      const hasLoadedForUser =
        prev.ownerUserId === targetUserId && prev.matches.length > 0;

      if (hasLoadedForUser) {
        return {
          ...prev,
          refreshError: null,
        };
      }

      return {
        ownerUserId: targetUserId,
        status: "loading",
        matches: [],
        error: null,
        refreshError: null,
      };
    });

    await executeMatchesFetch({
      targetUserId,
      sessionGeneration,
      requestVersion,
      isManualRefresh: true,
    });
  }, [executeMatchesFetch]);

  return {
    status: effectiveState.status,
    matches: effectiveState.matches,
    error: effectiveState.error,
    refreshError: effectiveState.refreshError,
    isRefreshing,
    refreshMatches,
  };
}

