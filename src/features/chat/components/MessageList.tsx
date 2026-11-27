import { useLayoutEffect, useRef, type ReactElement } from "react";
import type { ChatHistoryStatus, ChatMessage } from "../types/chat.types";
import MessageBubble from "./MessageBubble";

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  historyStatus: ChatHistoryStatus;
  historyError: string | null;
  hasMore: boolean;
  isLoadingOlder: boolean;
  olderError: string | null;
  onLoadOlder: () => Promise<void>;
  onRetryHistory: () => void;
}

export default function MessageList({
  messages,
  currentUserId,
  historyStatus,
  historyError,
  hasMore,
  isLoadingOlder,
  olderError,
  onLoadOlder,
  onRetryHistory,
}: MessageListProps): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollAnchorRef = useRef<{
    prevScrollHeight: number;
    prevScrollTop: number;
  } | null>(null);
  const prevLastMessageIdRef = useRef<string | null>(null);
  const prevMessageCountRef = useRef<number>(0);

  const handleLoadOlderClick = (): void => {
    const container = containerRef.current;
    if (container) {
      scrollAnchorRef.current = {
        prevScrollHeight: container.scrollHeight,
        prevScrollTop: container.scrollTop,
      };
    }

    void onLoadOlder();
  };

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const lastMessage = messages[messages.length - 1] ?? null;
    const lastId = lastMessage?.id ?? null;

    // 1. Preserve scroll position when prepending older messages
    if (
      scrollAnchorRef.current &&
      !isLoadingOlder &&
      messages.length > prevMessageCountRef.current
    ) {
      const { prevScrollHeight, prevScrollTop } = scrollAnchorRef.current;
      const heightDelta = container.scrollHeight - prevScrollHeight;
      container.scrollTop = Math.max(0, prevScrollTop + heightDelta);
      scrollAnchorRef.current = null;
      prevMessageCountRef.current = messages.length;
      prevLastMessageIdRef.current = lastId;
      return;
    }

    // 2. Scroll to bottom on initial load or when a newer message arrives at the end
    const isInitialBatch =
      prevMessageCountRef.current === 0 && messages.length > 0;
    const hasNewTailMessage =
      lastId !== null && lastId !== prevLastMessageIdRef.current;

    if (isInitialBatch) {
      container.scrollTop = container.scrollHeight;
    } else if (hasNewTailMessage) {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      const isOwnLatest = lastMessage?.senderId === currentUserId;

      if (isOwnLatest || distanceFromBottom < 140) {
        container.scrollTop = container.scrollHeight;
      }
    }

    prevMessageCountRef.current = messages.length;
    prevLastMessageIdRef.current = lastId;
  }, [currentUserId, isLoadingOlder, messages]);

  return (
    <div
      ref={containerRef}
      aria-label="Historial de mensajes"
      className="flex-1 overflow-y-auto bg-[#FBF9F5] px-4 py-4 sm:px-5 space-y-3"
    >
      {historyStatus === "loading" && messages.length === 0 && (
        <div
          role="status"
          className="h-full flex items-center justify-center text-xs text-[#74716A]"
        >
          Cargando historial de mensajes...
        </div>
      )}

      {historyStatus === "error" && messages.length === 0 && (
        <div
          role="alert"
          className="h-full flex flex-col items-center justify-center text-center gap-3 px-4"
        >
          <p className="text-sm text-[#8C4D27]">
            {historyError ?? "No se pudo cargar el historial de mensajes."}
          </p>
          <button
            type="button"
            onClick={onRetryHistory}
            className="rounded-lg bg-[#C17A4D] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#A6613A] focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/40"
          >
            Reintentar
          </button>
        </div>
      )}

      {hasMore && (
        <div className="flex flex-col items-center gap-1.5 pb-2">
          <button
            type="button"
            onClick={handleLoadOlderClick}
            disabled={isLoadingOlder}
            aria-busy={isLoadingOlder}
            className="rounded-full border border-[#E7E2D6] bg-white px-4 py-1.5 text-xs font-medium text-[#1C2321] transition hover:border-[#C17A4D] focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/30 disabled:opacity-60"
          >
            {isLoadingOlder
              ? "Cargando anteriores..."
              : "Cargar mensajes anteriores"}
          </button>
          {olderError && (
            <p role="alert" className="text-[11px] text-[#8C4D27]">
              {olderError}
            </p>
          )}
        </div>
      )}

      {historyStatus === "ready" && messages.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-center px-4">
          <p className="text-sm font-medium text-[#1C2321]">
            Aún no hay mensajes en esta conversación
          </p>
          <p className="mt-1 text-xs text-[#74716A]">
            Envía el primer saludo para coordinar sobre zonas, presupuesto y
            convivencia.
          </p>
        </div>
      )}

      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isOwn={message.senderId === currentUserId}
        />
      ))}
    </div>
  );
}

