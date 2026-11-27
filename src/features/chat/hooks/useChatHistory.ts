import { useCallback, useRef, useState } from "react";
import { ApiClientError } from "../../../lib/api-error";
import {
  DEFAULT_CHAT_HISTORY_LIMIT,
  getChatHistory,
  mergeChatMessages,
} from "../services/chat.service";
import type { ChatHistoryStatus, ChatMessage } from "../types/chat.types";

const MAX_RECONNECT_CATCHUP_BATCHES = 5;

export interface ChatHistoryState {
  matchId: string | null;
  status: ChatHistoryStatus;
  messages: ChatMessage[];
  hasMore: boolean;
  error: string | null;
  errorStatus: number | null;
  isLoadingOlder: boolean;
  olderError: string | null;
  syncWarning: string | null;
}

const INITIAL_HISTORY_STATE: ChatHistoryState = {
  matchId: null,
  status: "idle",
  messages: [],
  hasMore: false,
  error: null,
  errorStatus: null,
  isLoadingOlder: false,
  olderError: null,
  syncWarning: null,
};

export interface UseChatHistoryResult {
  historyState: ChatHistoryState;
  resetHistory: (nextMatchId: string | null) => void;
  appendRealtimeMessage: (matchId: string, message: ChatMessage) => void;
  loadInitialHistory: (
    matchId: string,
    isCurrentCheck: () => boolean,
  ) => Promise<void>;
  loadOlderMessages: (isCurrentCheck: () => boolean) => Promise<void>;
  syncMissedMessages: (
    matchId: string,
    isCurrentCheck: () => boolean,
  ) => Promise<void>;
}

export function useChatHistory(): UseChatHistoryResult {
  const [historyState, setHistoryState] = useState<ChatHistoryState>(
    INITIAL_HISTORY_STATE,
  );

  const messagesRef = useRef<ChatMessage[]>([]);
  const activeMatchIdRef = useRef<string | null>(null);
  const loadingOlderRef = useRef<boolean>(false);
  const syncingRef = useRef<boolean>(false);

  const resetHistory = useCallback((nextMatchId: string | null): void => {
    activeMatchIdRef.current = nextMatchId;
    messagesRef.current = [];
    loadingOlderRef.current = false;
    syncingRef.current = false;

    setHistoryState({
      matchId: nextMatchId,
      status: nextMatchId ? "loading" : "idle",
      messages: [],
      hasMore: false,
      error: null,
      errorStatus: null,
      isLoadingOlder: false,
      olderError: null,
      syncWarning: null,
    });
  }, []);

  const appendRealtimeMessage = useCallback(
    (matchId: string, message: ChatMessage): void => {
      if (
        activeMatchIdRef.current !== matchId ||
        message.matchId !== matchId
      ) {
        return;
      }

      setHistoryState((prev) => {
        if (prev.matchId !== matchId) {
          return prev;
        }

        const merged = mergeChatMessages(prev.messages, [message]);
        messagesRef.current = merged;

        return {
          ...prev,
          messages: merged,
        };
      });
    },
    [],
  );

  const loadInitialHistory = useCallback(
    async (
      matchId: string,
      isCurrentCheck: () => boolean,
    ): Promise<void> => {
      activeMatchIdRef.current = matchId;

      setHistoryState((prev) =>
        prev.matchId === matchId
          ? {
              ...prev,
              status: prev.messages.length > 0 ? "ready" : "loading",
              error: null,
              errorStatus: null,
              syncWarning: null,
            }
          : {
              ...INITIAL_HISTORY_STATE,
              matchId,
              status: "loading",
            },
      );

      try {
        const response = await getChatHistory(matchId, {
          page: 1,
          limit: DEFAULT_CHAT_HISTORY_LIMIT,
        });

        if (!isCurrentCheck() || activeMatchIdRef.current !== matchId) {
          return;
        }

        setHistoryState((prev) => {
          if (prev.matchId !== matchId) {
            return prev;
          }

          // Merge non-destructively so real-time messages received during the HTTP call are never lost
          const merged = mergeChatMessages(prev.messages, response.data);
          messagesRef.current = merged;

          return {
            ...prev,
            status: "ready",
            messages: merged,
            hasMore: response.meta.hasMore,
            error: null,
            errorStatus: null,
            olderError: null,
            syncWarning: null,
          };
        });
      } catch (err: unknown) {
        if (!isCurrentCheck() || activeMatchIdRef.current !== matchId) {
          return;
        }

        if (
          err instanceof ApiClientError &&
          err.kind === "http" &&
          err.status === 401
        ) {
          return;
        }

        const message =
          err instanceof ApiClientError
            ? err.message
            : "No se pudo cargar el historial de mensajes.";
        const errorStatus =
          err instanceof ApiClientError && err.kind === "http"
            ? (err.status ?? null)
            : null;

        setHistoryState((prev) => ({
          ...prev,
          matchId,
          status: "error",
          error: message,
          errorStatus,
        }));
      }
    },
    [],
  );

  const loadOlderMessages = useCallback(
    async (isCurrentCheck: () => boolean): Promise<void> => {
      const matchId = activeMatchIdRef.current;
      const currentMessages = messagesRef.current;
      const oldest = currentMessages[0];

      if (!matchId || !oldest || loadingOlderRef.current) {
        return;
      }

      loadingOlderRef.current = true;
      setHistoryState((prev) => ({
        ...prev,
        isLoadingOlder: true,
        olderError: null,
      }));

      try {
        const response = await getChatHistory(matchId, {
          limit: DEFAULT_CHAT_HISTORY_LIMIT,
          before: oldest.createdAt,
          beforeId: oldest.id,
        });

        if (!isCurrentCheck() || activeMatchIdRef.current !== matchId) {
          return;
        }

        setHistoryState((prev) => {
          if (prev.matchId !== matchId) {
            return prev;
          }

          const merged = mergeChatMessages(prev.messages, response.data);
          messagesRef.current = merged;

          return {
            ...prev,
            messages: merged,
            hasMore: response.meta.hasMore,
            isLoadingOlder: false,
            olderError: null,
          };
        });
      } catch (err: unknown) {
        if (!isCurrentCheck() || activeMatchIdRef.current !== matchId) {
          return;
        }

        const message =
          err instanceof ApiClientError
            ? err.message
            : "No se pudieron cargar mensajes anteriores.";

        setHistoryState((prev) => ({
          ...prev,
          isLoadingOlder: false,
          olderError: message,
        }));
      } finally {
        loadingOlderRef.current = false;
      }
    },
    [],
  );

  /**
   * Synchronizes messages missed during a disconnection or uncertain send timeout,
   * fetching multiple bounded batches using the composite cursor (before, beforeId)
   * until bridging back to the previously known anchor message.
   */
  const syncMissedMessages = useCallback(
    async (
      matchId: string,
      isCurrentCheck: () => boolean,
    ): Promise<void> => {
      if (syncingRef.current || activeMatchIdRef.current !== matchId) {
        return;
      }

      syncingRef.current = true;
      const knownIds = new Set(messagesRef.current.map((m) => m.id));
      const hadKnownMessages = knownIds.size > 0;

      const collected: ChatMessage[] = [];
      let cursor: { before: string; beforeId: string } | undefined;
      let bridgedKnownHistory = !hadKnownMessages;
      let lastHasMore = false;
      let batchCount = 0;

      try {
        while (batchCount < MAX_RECONNECT_CATCHUP_BATCHES) {
          batchCount += 1;

          const response = await getChatHistory(matchId, {
            limit: DEFAULT_CHAT_HISTORY_LIMIT,
            ...(cursor
              ? { before: cursor.before, beforeId: cursor.beforeId }
              : { page: 1 }),
          });

          if (!isCurrentCheck() || activeMatchIdRef.current !== matchId) {
            return;
          }

          collected.push(...response.data);
          lastHasMore = response.meta.hasMore;

          const reachedKnownMessage = response.data.some((m) =>
            knownIds.has(m.id),
          );
          if (reachedKnownMessage || !response.meta.hasMore) {
            bridgedKnownHistory = true;
            break;
          }

          const oldestInBatch = response.data[0];
          if (!oldestInBatch) {
            bridgedKnownHistory = true;
            break;
          }

          cursor = {
            before: oldestInBatch.createdAt,
            beforeId: oldestInBatch.id,
          };
        }

        if (!isCurrentCheck() || activeMatchIdRef.current !== matchId) {
          return;
        }

        setHistoryState((prev) => {
          if (prev.matchId !== matchId) {
            return prev;
          }

          const merged = mergeChatMessages(prev.messages, collected);
          messagesRef.current = merged;

          return {
            ...prev,
            status: "ready",
            messages: merged,
            hasMore: hadKnownMessages ? prev.hasMore || lastHasMore : lastHasMore,
            error: null,
            errorStatus: null,
            syncWarning: bridgedKnownHistory
              ? null
              : "Hubo mucha actividad durante la desconexión y no se sincronizó todo el historial automáticamente. Puedes actualizar o cargar mensajes anteriores.",
          };
        });
      } catch (err: unknown) {
        if (!isCurrentCheck() || activeMatchIdRef.current !== matchId) {
          return;
        }

        if (
          err instanceof ApiClientError &&
          err.kind === "http" &&
          err.status === 401
        ) {
          return;
        }

        setHistoryState((prev) => ({
          ...prev,
          syncWarning:
            "Se restableció la conexión, pero no se pudo sincronizar el historial reciente automáticamente. Intenta actualizar.",
        }));
      } finally {
        syncingRef.current = false;
      }
    },
    [],
  );

  return {
    historyState,
    resetHistory,
    appendRealtimeMessage,
    loadInitialHistory,
    loadOlderMessages,
    syncMissedMessages,
  };
}

