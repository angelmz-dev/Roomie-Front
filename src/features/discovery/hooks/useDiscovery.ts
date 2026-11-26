import { useCallback, useEffect, useRef, useState } from "react";
import { ApiClientError } from "../../../lib/api-error";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  DEFAULT_DISCOVERY_LIMIT,
  createInteraction,
  getDiscoveryFeed,
} from "../services/discovery.service";
import type {
  DiscoveryCandidate,
  DiscoveryFeedStatus,
  InteractionType,
  MatchEvent,
  MatchRecord,
} from "../types/discovery.types";

function isValidMatchRecord(value: unknown): value is MatchRecord {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    record.id.trim().length > 0 &&
    typeof record.user1Id === "string" &&
    record.user1Id.trim().length > 0 &&
    typeof record.user2Id === "string" &&
    record.user2Id.trim().length > 0 &&
    typeof record.createdAt === "string" &&
    record.createdAt.trim().length > 0
  );
}

function deduplicateCandidates(
  incoming: readonly DiscoveryCandidate[],
  currentUserId: string,
  interactedUserIds: ReadonlySet<string>,
  existingQueue: readonly DiscoveryCandidate[] = [],
): DiscoveryCandidate[] {
  const seen = new Set<string>(existingQueue.map((item) => item.userId));
  const filtered: DiscoveryCandidate[] = [];

  for (const candidate of incoming) {
    if (
      !candidate.userId ||
      candidate.userId === currentUserId ||
      interactedUserIds.has(candidate.userId) ||
      seen.has(candidate.userId)
    ) {
      continue;
    }

    seen.add(candidate.userId);
    filtered.push(candidate);
  }

  return filtered;
}

interface InternalDiscoveryState {
  ownerUserId: string | null;
  status: DiscoveryFeedStatus;
  candidates: DiscoveryCandidate[];
  feedError: string | null;
}

const INITIAL_STATE: InternalDiscoveryState = {
  ownerUserId: null,
  status: "loading",
  candidates: [],
  feedError: null,
};

export interface UseDiscoveryResult {
  status: DiscoveryFeedStatus;
  currentCandidate: DiscoveryCandidate | null;
  loadedCount: number;
  feedError: string | null;
  isRefreshing: boolean;
  isSubmittingInteraction: boolean;
  pendingAction: InteractionType | null;
  interactionError: string | null;
  interactionNotice: string | null;
  matchEvent: MatchEvent | null;
  interact: (type: InteractionType) => Promise<void>;
  refreshFeed: () => Promise<void>;
  dismissMatchModal: () => void;
  clearInteractionFeedback: () => void;
}

export function useDiscovery(): UseDiscoveryResult {
  const { isAuthenticated, user } = useAuth();
  const activeUserId = isAuthenticated && user ? user.id : null;

  const [state, setState] = useState<InternalDiscoveryState>(INITIAL_STATE);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSubmittingInteraction, setIsSubmittingInteraction] =
    useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<InteractionType | null>(
    null,
  );
  const [interactionError, setInteractionError] = useState<string | null>(null);
  const [interactionNotice, setInteractionNotice] = useState<string | null>(
    null,
  );
  const [matchEvent, setMatchEvent] = useState<MatchEvent | null>(null);

  const activeUserIdRef = useRef<string | null>(activeUserId);
  const sessionGenerationRef = useRef<number>(0);
  const feedRequestVersionRef = useRef<number>(0);
  const interactedUserIdsRef = useRef<Set<string>>(new Set());
  const hasPotentialMoreRef = useRef<boolean>(false);
  const submittingRef = useRef<boolean>(false);
  const fetchingFeedRef = useRef<boolean>(false);

  const executeFeedLoad = useCallback(
    async (options: {
      targetUserId: string;
      sessionGeneration: number;
      requestVersion: number;
      isCancelledCheck?: () => boolean;
      preserveNotice?: boolean;
    }): Promise<void> => {
      fetchingFeedRef.current = true;

      try {
        const response = await getDiscoveryFeed({
          page: 1,
          limit: DEFAULT_DISCOVERY_LIMIT,
        });

        if (
          options.isCancelledCheck?.() ||
          activeUserIdRef.current !== options.targetUserId ||
          sessionGenerationRef.current !== options.sessionGeneration ||
          feedRequestVersionRef.current !== options.requestVersion
        ) {
          return;
        }

        const freshCandidates = deduplicateCandidates(
          response.data,
          options.targetUserId,
          interactedUserIdsRef.current,
        );

        // Anti-infinite-loop guard: only assume more pages may exist when the backend
        // returned a full batch AND at least one candidate was genuinely new.
        hasPotentialMoreRef.current =
          response.meta.returned === DEFAULT_DISCOVERY_LIMIT &&
          freshCandidates.length > 0;

        setState({
          ownerUserId: options.targetUserId,
          status: freshCandidates.length > 0 ? "ready" : "empty",
          candidates: freshCandidates,
          feedError: null,
        });

        setInteractionError(null);
        if (!options.preserveNotice) {
          setInteractionNotice(null);
        }
      } catch (error: unknown) {
        if (
          options.isCancelledCheck?.() ||
          activeUserIdRef.current !== options.targetUserId ||
          sessionGenerationRef.current !== options.sessionGeneration ||
          feedRequestVersionRef.current !== options.requestVersion
        ) {
          return;
        }

        if (
          error instanceof ApiClientError &&
          error.kind === "http" &&
          error.status === 401
        ) {
          // Axios interceptor handles active session invalidation
          return;
        }

        const message =
          error instanceof ApiClientError
            ? error.message
            : "No se pudo cargar el feed de candidatos. Intenta nuevamente.";

        setState({
          ownerUserId: options.targetUserId,
          status: "error",
          candidates: [],
          feedError: message,
        });
      } finally {
        if (
          sessionGenerationRef.current === options.sessionGeneration &&
          feedRequestVersionRef.current === options.requestVersion
        ) {
          fetchingFeedRef.current = false;
          setIsRefreshing(false);
        }
      }
    },
    [],
  );

  // Initial load and complete session-change / logout cleanup (immune to same-user re-login races)
  useEffect(() => {
    activeUserIdRef.current = activeUserId;
    const nextGeneration = ++sessionGenerationRef.current;
    interactedUserIdsRef.current = new Set();
    hasPotentialMoreRef.current = false;
    submittingRef.current = false;
    fetchingFeedRef.current = false;

    if (!activeUserId) {
      feedRequestVersionRef.current += 1;
      return;
    }

    let isCancelled = false;
    const requestVersion = ++feedRequestVersionRef.current;

    void executeFeedLoad({
      targetUserId: activeUserId,
      sessionGeneration: nextGeneration,
      requestVersion,
      isCancelledCheck: () => isCancelled,
    });

    return () => {
      isCancelled = true;
      sessionGenerationRef.current += 1;
      feedRequestVersionRef.current += 1;
    };
  }, [activeUserId, executeFeedLoad]);

  const effectiveState =
    activeUserId && state.ownerUserId === activeUserId
      ? state
      : {
          ownerUserId: activeUserId,
          status: "loading" as DiscoveryFeedStatus,
          candidates: [] as DiscoveryCandidate[],
          feedError: null as string | null,
        };

  const currentCandidate = effectiveState.candidates[0] ?? null;

  const refreshFeed = useCallback(async (): Promise<void> => {
    const targetUserId = activeUserIdRef.current;
    if (!targetUserId || fetchingFeedRef.current || submittingRef.current) {
      return;
    }

    const sessionGeneration = sessionGenerationRef.current;
    const requestVersion = ++feedRequestVersionRef.current;

    setIsRefreshing(true);
    setInteractionError(null);
    setInteractionNotice(null);
    setState((prev) => ({
      ownerUserId: targetUserId,
      status: prev.candidates.length > 0 ? prev.status : "loading",
      candidates: prev.ownerUserId === targetUserId ? prev.candidates : [],
      feedError: null,
    }));

    await executeFeedLoad({
      targetUserId,
      sessionGeneration,
      requestVersion,
    });
  }, [executeFeedLoad]);

  const advanceAfterCandidateRemoval = useCallback(
    async (options: {
      removedUserId: string;
      targetUserId: string;
      sessionGeneration: number;
      preserveNotice?: boolean;
    }): Promise<void> => {
      interactedUserIdsRef.current.add(options.removedUserId);

      let remainingCount = 0;

      setState((prev) => {
        if (prev.ownerUserId !== options.targetUserId) {
          return prev;
        }

        const nextCandidates = prev.candidates.filter(
          (candidate) => candidate.userId !== options.removedUserId,
        );
        remainingCount = nextCandidates.length;

        if (nextCandidates.length > 0) {
          return {
            ...prev,
            status: "ready",
            candidates: nextCandidates,
            feedError: null,
          };
        }

        return {
          ...prev,
          status: hasPotentialMoreRef.current ? "loading" : "empty",
          candidates: [],
          feedError: null,
        };
      });

      // When the current batch is exhausted after interactions, fetch page=1
      // because interacted candidates are already excluded by the backend.
      if (remainingCount === 0 && hasPotentialMoreRef.current) {
        const requestVersion = ++feedRequestVersionRef.current;
        await executeFeedLoad({
          targetUserId: options.targetUserId,
          sessionGeneration: options.sessionGeneration,
          requestVersion,
          preserveNotice: options.preserveNotice,
        });
      }
    },
    [executeFeedLoad],
  );

  const interact = useCallback(
    async (type: InteractionType): Promise<void> => {
      const targetUserId = activeUserIdRef.current;
      if (
        !targetUserId ||
        !currentCandidate ||
        matchEvent !== null ||
        submittingRef.current ||
        isSubmittingInteraction
      ) {
        return;
      }

      const sessionGeneration = sessionGenerationRef.current;
      const candidateSnapshot = currentCandidate;

      submittingRef.current = true;
      setIsSubmittingInteraction(true);
      setPendingAction(type);
      setInteractionError(null);
      setInteractionNotice(null);

      try {
        const response = await createInteraction({
          toUserId: candidateSnapshot.userId,
          type,
        });

        if (
          activeUserIdRef.current !== targetUserId ||
          sessionGenerationRef.current !== sessionGeneration
        ) {
          return;
        }

        if (
          response.data.isMatch === true &&
          isValidMatchRecord(response.data.match)
        ) {
          setMatchEvent({
            match: response.data.match,
            candidate: candidateSnapshot,
          });
        }

        await advanceAfterCandidateRemoval({
          removedUserId: candidateSnapshot.userId,
          targetUserId,
          sessionGeneration,
        });
      } catch (error: unknown) {
        if (
          activeUserIdRef.current !== targetUserId ||
          sessionGenerationRef.current !== sessionGeneration
        ) {
          return;
        }

        if (error instanceof ApiClientError && error.kind === "http") {
          if (error.status === 401) {
            // Axios interceptor handles active session invalidation
            return;
          }

          if (error.status === 409) {
            setInteractionNotice(
              "Este candidato ya había sido evaluado previamente. Avanzando al siguiente perfil.",
            );
            await advanceAfterCandidateRemoval({
              removedUserId: candidateSnapshot.userId,
              targetUserId,
              sessionGeneration,
              preserveNotice: true,
            });
            return;
          }
        }

        // Recoverable error: keep candidate in queue so the user can retry safely
        const message =
          error instanceof ApiClientError
            ? error.message
            : "No se pudo registrar tu interacción. Intenta nuevamente.";
        setInteractionError(message);
      } finally {
        if (sessionGenerationRef.current === sessionGeneration) {
          submittingRef.current = false;
          setIsSubmittingInteraction(false);
          setPendingAction(null);
        }
      }
    },
    [
      advanceAfterCandidateRemoval,
      currentCandidate,
      isSubmittingInteraction,
      matchEvent,
    ],
  );

  const dismissMatchModal = useCallback((): void => {
    setMatchEvent(null);
  }, []);

  const clearInteractionFeedback = useCallback((): void => {
    setInteractionError(null);
    setInteractionNotice(null);
  }, []);

  return {
    status: effectiveState.status,
    currentCandidate,
    loadedCount: effectiveState.candidates.length,
    feedError: effectiveState.feedError,
    isRefreshing,
    isSubmittingInteraction,
    pendingAction,
    interactionError,
    interactionNotice,
    matchEvent:
      activeUserId && state.ownerUserId === activeUserId ? matchEvent : null,
    interact,
    refreshFeed,
    dismissMatchModal,
    clearInteractionFeedback,
  };
}

