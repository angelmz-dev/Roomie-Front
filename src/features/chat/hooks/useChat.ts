import { useCallback, useEffect, useRef, useState } from "react";
import { getStoredToken } from "../../../lib/auth-storage";
import { createChatSocket, type ChatSocket } from "../../../lib/socket";
import { useAuth } from "../../auth/hooks/useAuth";
import { MAX_CHAT_MESSAGE_LENGTH } from "../services/chat.service";
import type {
  ChatConnectionStatus,
  ChatHistoryStatus,
  ChatMessage,
  SendMessageResult,
  SocketAckResponse,
  SocketChatErrorPayload,
} from "../types/chat.types";
import { useChatHistory } from "./useChatHistory";

const SOCKET_ACK_TIMEOUT_MS = 10_000;

function isAuthHandshakeError(message: string): boolean {
  const upper = message.toUpperCase();
  return upper.includes("TOKEN_EXPIRED") || upper.includes("UNAUTHORIZED");
}

export interface UseChatResult {
  connectionStatus: ChatConnectionStatus;
  connectionError: string | null;
  roomAccessError: string | null;
  historyStatus: ChatHistoryStatus;
  messages: ChatMessage[];
  hasMore: boolean;
  historyError: string | null;
  isLoadingOlder: boolean;
  olderError: string | null;
  syncWarning: string | null;
  isSending: boolean;
  sendFeedback: { tone: "error" | "warning"; message: string } | null;
  sendMessage: (rawContent: string) => Promise<SendMessageResult>;
  loadOlderMessages: () => Promise<void>;
  retrySync: () => Promise<void>;
  clearSendFeedback: () => void;
}

export function useChat(selectedMatchId: string | null): UseChatResult {
  const { isAuthenticated, user, logout } = useAuth();
  const activeUserId = isAuthenticated && user ? user.id : null;

  const {
    historyState,
    resetHistory,
    appendRealtimeMessage,
    loadInitialHistory,
    loadOlderMessages: fetchOlderHistory,
    syncMissedMessages,
  } = useChatHistory();

  const [connectionStatus, setConnectionStatus] =
    useState<ChatConnectionStatus>("disconnected");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [roomAccessError, setRoomAccessError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendFeedback, setSendFeedback] = useState<{
    tone: "error" | "warning";
    message: string;
  } | null>(null);

  const socketRef = useRef<ChatSocket | null>(null);
  const sessionGenerationRef = useRef<number>(0);
  const conversationVersionRef = useRef<number>(0);
  const activeMatchIdRef = useRef<string | null>(selectedMatchId);
  const joinedMatchIdRef = useRef<string | null>(null);
  const hasConnectedOnceRef = useRef<boolean>(false);
  const sendingRef = useRef<boolean>(false);
  const activeUserIdRef = useRef<string | null>(activeUserId);

  useEffect(() => {
    activeUserIdRef.current = activeUserId;
  }, [activeUserId]);

  const joinRoomWithAck = useCallback(
    (
      socket: ChatSocket,
      matchId: string,
    ): Promise<SocketAckResponse<{ matchId: string }>> =>
      new Promise((resolve) => {
        let settled = false;

        const timer = window.setTimeout(() => {
          if (!settled) {
            settled = true;
            resolve({
              ok: false,
              code: "SEND_FAILED",
              error: "No se recibió confirmación al ingresar a la conversación.",
            });
          }
        }, SOCKET_ACK_TIMEOUT_MS);

        socket.emit("join_match_room", matchId, (response) => {
          if (!settled) {
            settled = true;
            window.clearTimeout(timer);
            resolve(response);
          }
        });
      }),
    [],
  );

  const openOrRecoverConversation = useCallback(
    async (options: {
      socket: ChatSocket;
      matchId: string;
      sessionGeneration: number;
      conversationVersion: number;
      isReconnect: boolean;
    }): Promise<void> => {
      const isCurrent = (): boolean =>
        sessionGenerationRef.current === options.sessionGeneration &&
        conversationVersionRef.current === options.conversationVersion &&
        activeMatchIdRef.current === options.matchId;

      const joinAck = await joinRoomWithAck(options.socket, options.matchId);

      if (!isCurrent()) {
        return;
      }

      if (!joinAck.ok) {
        if (joinAck.code === "TOKEN_EXPIRED" || joinAck.code === "UNAUTHORIZED") {
          options.socket.disconnect();
          logout();
          return;
        }

        if (joinAck.code === "FORBIDDEN" || joinAck.code === "NOT_FOUND") {
          setRoomAccessError(joinAck.error);
          return;
        }

        setConnectionError(joinAck.error);
        return;
      }

      joinedMatchIdRef.current = options.matchId;
      setRoomAccessError(null);
      setConnectionError(null);

      // Guaranteed ordering: listeners registered -> join confirmed -> REST sync -> merge
      if (options.isReconnect) {
        await syncMissedMessages(options.matchId, isCurrent);
      } else {
        await loadInitialHistory(options.matchId, isCurrent);
      }
    },
    [joinRoomWithAck, loadInitialHistory, logout, syncMissedMessages],
  );

  // 1. Socket.IO connection lifecycle scoped strictly to the Chat module and active user session
  useEffect(() => {
    const nextSessionGeneration = ++sessionGenerationRef.current;
    hasConnectedOnceRef.current = false;
    joinedMatchIdRef.current = null;
    sendingRef.current = false;

    if (!activeUserId) {
      return;
    }

    const token = getStoredToken();
    if (!token) {
      return;
    }

    let socket: ChatSocket;
    try {
      socket = createChatSocket(getStoredToken);
    } catch {
      return;
    }

    socketRef.current = socket;

    const handleConnect = (): void => {
      if (sessionGenerationRef.current !== nextSessionGeneration) {
        return;
      }

      const isReconnect = hasConnectedOnceRef.current;
      hasConnectedOnceRef.current = true;
      setConnectionStatus("connected");
      setConnectionError(null);

      const currentMatchId = activeMatchIdRef.current;
      if (currentMatchId) {
        const convVersion = conversationVersionRef.current;
        void openOrRecoverConversation({
          socket,
          matchId: currentMatchId,
          sessionGeneration: nextSessionGeneration,
          conversationVersion: convVersion,
          isReconnect,
        });
      }
    };

    const handleDisconnect = (): void => {
      if (sessionGenerationRef.current !== nextSessionGeneration) {
        return;
      }

      joinedMatchIdRef.current = null;
      setConnectionStatus("disconnected");
    };

    const handleConnectError = (err: Error): void => {
      if (sessionGenerationRef.current !== nextSessionGeneration) {
        return;
      }

      // Differentiate authentication failure from temporary network/transport error
      if (isAuthHandshakeError(err.message)) {
        socket.disconnect();
        logout();
        return;
      }

      setConnectionStatus("reconnecting");
      setConnectionError(
        "No se pudo conectar al chat en tiempo real. Intentando reconectar...",
      );
    };

    const handleReceiveMessage = (message: ChatMessage): void => {
      if (sessionGenerationRef.current !== nextSessionGeneration) {
        return;
      }

      const currentMatchId = activeMatchIdRef.current;
      if (!currentMatchId || message.matchId !== currentMatchId) {
        return;
      }

      appendRealtimeMessage(currentMatchId, message);
    };

    const handleChatError = (payload: SocketChatErrorPayload): void => {
      if (sessionGenerationRef.current !== nextSessionGeneration) {
        return;
      }

      if (payload.code === "TOKEN_EXPIRED" || payload.code === "UNAUTHORIZED") {
        socket.disconnect();
        logout();
      }
    };

    const handleReconnectAttempt = (): void => {
      if (sessionGenerationRef.current !== nextSessionGeneration) {
        return;
      }

      if (!getStoredToken()) {
        socket.disconnect();
        logout();
        return;
      }

      setConnectionStatus("reconnecting");
    };

    const handleReconnectFailed = (): void => {
      if (sessionGenerationRef.current !== nextSessionGeneration) {
        return;
      }

      setConnectionStatus("error");
      setConnectionError(
        "Se perdió la conexión con el chat en tiempo real. Verifica tu red e intenta actualizar.",
      );
    };

    // Register listeners BEFORE connecting
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("receive_message", handleReceiveMessage);
    socket.on("chat_error", handleChatError);
    socket.io.on("reconnect_attempt", handleReconnectAttempt);
    socket.io.on("reconnect_failed", handleReconnectFailed);

    socket.connect();

    return () => {
      sessionGenerationRef.current += 1;
      conversationVersionRef.current += 1;

      const previousRoom = joinedMatchIdRef.current;
      if (previousRoom && socket.connected) {
        socket.emit("leave_match_room", previousRoom);
      }

      socket.removeAllListeners();
      socket.io.off("reconnect_attempt", handleReconnectAttempt);
      socket.io.off("reconnect_failed", handleReconnectFailed);
      socket.disconnect();

      if (socketRef.current === socket) {
        socketRef.current = null;
      }
      joinedMatchIdRef.current = null;
      sendingRef.current = false;
    };
  }, [activeUserId, appendRealtimeMessage, logout, openOrRecoverConversation]);

  // 2. Active conversation switching (leave previous room -> reset -> join -> REST history)
  useEffect(() => {
    const previousMatchId = activeMatchIdRef.current;
    activeMatchIdRef.current = selectedMatchId;
    const nextConversationVersion = ++conversationVersionRef.current;
    const currentSessionGeneration = sessionGenerationRef.current;

    const socket = socketRef.current;
    if (
      socket &&
      socket.connected &&
      previousMatchId &&
      previousMatchId !== selectedMatchId
    ) {
      socket.emit("leave_match_room", previousMatchId);
      if (joinedMatchIdRef.current === previousMatchId) {
        joinedMatchIdRef.current = null;
      }
    }

    const timeoutId = window.setTimeout(() => {
      if (
        sessionGenerationRef.current !== currentSessionGeneration ||
        conversationVersionRef.current !== nextConversationVersion
      ) {
        return;
      }

      setRoomAccessError(null);
      setSendFeedback(null);
      resetHistory(selectedMatchId);

      if (!selectedMatchId || !activeUserIdRef.current) {
        return;
      }

      const activeSocket = socketRef.current;
      if (activeSocket && activeSocket.connected) {
        void openOrRecoverConversation({
          socket: activeSocket,
          matchId: selectedMatchId,
          sessionGeneration: currentSessionGeneration,
          conversationVersion: nextConversationVersion,
          isReconnect: false,
        });
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      conversationVersionRef.current += 1;
    };
  }, [selectedMatchId, activeUserId, openOrRecoverConversation, resetHistory]);

  const sendMessage = useCallback(
    async (rawContent: string): Promise<SendMessageResult> => {
      const matchId = activeMatchIdRef.current;
      const socket = socketRef.current;
      const trimmed = rawContent.trim();

      if (!matchId || !activeUserIdRef.current) {
        return {
          outcome: "rejected",
          feedback: "Selecciona una conversación válida antes de enviar.",
        };
      }

      if (trimmed.length === 0) {
        return {
          outcome: "rejected",
          feedback: "Escribe un mensaje antes de enviar.",
        };
      }

      if (trimmed.length > MAX_CHAT_MESSAGE_LENGTH) {
        return {
          outcome: "rejected",
          feedback: `El mensaje no puede superar los ${MAX_CHAT_MESSAGE_LENGTH} caracteres.`,
        };
      }

      if (!socket || !socket.connected) {
        const message =
          "Sin conexión al chat en tiempo real. Espera a reconectar para enviar tu mensaje.";
        setSendFeedback({ tone: "error", message });
        return { outcome: "rejected", feedback: message };
      }

      if (sendingRef.current) {
        return { outcome: "rejected", feedback: null };
      }

      const sessionGeneration = sessionGenerationRef.current;
      const conversationVersion = conversationVersionRef.current;

      sendingRef.current = true;
      setIsSending(true);
      setSendFeedback(null);

      const isCurrent = (): boolean =>
        sessionGenerationRef.current === sessionGeneration &&
        conversationVersionRef.current === conversationVersion &&
        activeMatchIdRef.current === matchId;

      return await new Promise<SendMessageResult>((resolve) => {
        let settled = false;

        const finish = (result: SendMessageResult): void => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeoutId);
          socket.off("disconnect", handleDisconnectMidSend);

          if (sessionGenerationRef.current === sessionGeneration) {
            sendingRef.current = false;
            setIsSending(false);
          }

          resolve(result);
        };

        const handleUncertainOutcome = (reason: string): void => {
          if (!isCurrent()) {
            finish({ outcome: "uncertain", feedback: null });
            return;
          }

          setSendFeedback({ tone: "warning", message: reason });
          // Synchronize history to verify whether the message persisted on the server
          void syncMissedMessages(matchId, isCurrent);
          finish({ outcome: "uncertain", feedback: reason });
        };

        const handleDisconnectMidSend = (): void => {
          handleUncertainOutcome(
            "Se perdió la conexión antes de confirmar el envío. Tu mensaje podría haberse guardado; verifica el historial al reconectar antes de reenviar.",
          );
        };

        const timeoutId = window.setTimeout(() => {
          handleUncertainOutcome(
            "El servidor tardó en confirmar el envío. Sincronizamos el historial para verificar si tu mensaje se guardó antes de reenviar.",
          );
        }, SOCKET_ACK_TIMEOUT_MS);

        socket.once("disconnect", handleDisconnectMidSend);

        socket.emit(
          "send_message",
          { matchId, content: trimmed },
          (ackResponse) => {
            if (!isCurrent()) {
              finish({ outcome: "rejected", feedback: null });
              return;
            }

            if (ackResponse.ok) {
              appendRealtimeMessage(matchId, ackResponse.data);
              setSendFeedback(null);
              finish({ outcome: "confirmed", feedback: null });
              return;
            }

            if (
              ackResponse.code === "TOKEN_EXPIRED" ||
              ackResponse.code === "UNAUTHORIZED"
            ) {
              socket.disconnect();
              logout();
              finish({ outcome: "rejected", feedback: ackResponse.error });
              return;
            }

            setSendFeedback({ tone: "error", message: ackResponse.error });
            finish({ outcome: "rejected", feedback: ackResponse.error });
          },
        );
      });
    },
    [appendRealtimeMessage, logout, syncMissedMessages],
  );

  const loadOlderMessages = useCallback(async (): Promise<void> => {
    const matchId = activeMatchIdRef.current;
    if (!matchId) return;

    const sessionGeneration = sessionGenerationRef.current;
    const conversationVersion = conversationVersionRef.current;

    await fetchOlderHistory(
      () =>
        sessionGenerationRef.current === sessionGeneration &&
        conversationVersionRef.current === conversationVersion &&
        activeMatchIdRef.current === matchId,
    );
  }, [fetchOlderHistory]);

  const retrySync = useCallback(async (): Promise<void> => {
    const matchId = activeMatchIdRef.current;
    const socket = socketRef.current;
    if (!matchId) return;

    const sessionGeneration = sessionGenerationRef.current;
    const conversationVersion = conversationVersionRef.current;

    if (socket && !socket.connected) {
      setConnectionStatus("connecting");
      setConnectionError(null);
      socket.connect();
      return;
    }

    if (socket && socket.connected) {
      await openOrRecoverConversation({
        socket,
        matchId,
        sessionGeneration,
        conversationVersion,
        isReconnect: historyState.messages.length > 0,
      });
    }
  }, [historyState.messages.length, openOrRecoverConversation]);

  const clearSendFeedback = useCallback((): void => {
    setSendFeedback(null);
  }, []);

  const effectiveRoomAccessError =
    roomAccessError ??
    (historyState.errorStatus === 403 || historyState.errorStatus === 404
      ? historyState.error
      : null);

  return {
    connectionStatus: activeUserId ? connectionStatus : "disconnected",
    connectionError: activeUserId ? connectionError : null,
    roomAccessError: activeUserId ? effectiveRoomAccessError : null,
    historyStatus:
      activeUserId && historyState.matchId === selectedMatchId
        ? historyState.status
        : selectedMatchId
          ? "loading"
          : "idle",
    messages:
      activeUserId && historyState.matchId === selectedMatchId
        ? historyState.messages
        : [],
    hasMore:
      activeUserId && historyState.matchId === selectedMatchId
        ? historyState.hasMore
        : false,
    historyError:
      activeUserId && historyState.matchId === selectedMatchId
        ? historyState.error
        : null,
    isLoadingOlder:
      activeUserId && historyState.matchId === selectedMatchId
        ? historyState.isLoadingOlder
        : false,
    olderError:
      activeUserId && historyState.matchId === selectedMatchId
        ? historyState.olderError
        : null,
    syncWarning:
      activeUserId && historyState.matchId === selectedMatchId
        ? historyState.syncWarning
        : null,
    isSending,
    sendFeedback,
    sendMessage,
    loadOlderMessages,
    retrySync,
    clearSendFeedback,
  };
}

