import type { ReactElement } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { useMatches } from "../../matches/hooks/useMatches";
import ChatEmptyState from "../components/ChatEmptyState";
import ConversationHeader from "../components/ConversationHeader";
import ConversationList from "../components/ConversationList";
import MessageComposer from "../components/MessageComposer";
import MessageList from "../components/MessageList";
import { useChat } from "../hooks/useChat";

export default function ChatPage(): ReactElement {
  const { matchId } = useParams<{ matchId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const selectedMatchId =
    typeof matchId === "string" && matchId.trim().length > 0
      ? matchId.trim()
      : null;

  const {
    status: matchesStatus,
    matches,
    error: matchesError,
    refreshMatches,
  } = useMatches();

  const {
    connectionStatus,
    connectionError,
    roomAccessError,
    historyStatus,
    messages,
    hasMore,
    historyError,
    isLoadingOlder,
    olderError,
    syncWarning,
    isSending,
    sendFeedback,
    sendMessage,
    loadOlderMessages,
    retrySync,
    clearSendFeedback,
  } = useChat(selectedMatchId);

  const selectedMatch =
    selectedMatchId !== null
      ? (matches.find((item) => item.matchId === selectedMatchId) ?? null)
      : null;

  const handleSelectMatch = (nextMatchId: string): void => {
    navigate(`/app/chat/${nextMatchId}`);
  };

  const handleBackToList = (): void => {
    navigate("/app/chat");
  };

  const showSidebarOnMobile = selectedMatchId === null;

  return (
    <div className="w-full max-w-5xl h-[calc(100vh-8.5rem)] min-h-[520px] rounded-2xl border border-[#E7E2D6] bg-white shadow-sm overflow-hidden flex">
      {/* Bandeja lateral de matches */}
      <div
        className={`${
          showSidebarOnMobile ? "flex w-full" : "hidden"
        } md:flex md:w-80 lg:w-88 shrink-0 flex-col`}
      >
        <ConversationList
          status={matchesStatus}
          matches={matches}
          selectedMatchId={selectedMatchId}
          error={matchesError}
          onSelectMatch={handleSelectMatch}
          onRetry={() => {
            void refreshMatches();
          }}
        />
      </div>

      {/* Área de conversación activa */}
      <section
        aria-label="Conversación activa"
        className={`${
          showSidebarOnMobile ? "hidden md:flex" : "flex"
        } flex-1 min-w-0 flex-col bg-[#FBF9F5]`}
      >
        {!selectedMatchId ? (
          <ChatEmptyState hasMatches={matches.length > 0} />
        ) : roomAccessError ? (
          <div
            role="alert"
            className="flex h-full flex-col items-center justify-center p-8 text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#C17A4D]/15 text-[#C17A4D] text-lg font-semibold">
              !
            </div>
            <h2 className="mt-4 text-lg font-semibold text-[#1C2321]">
              Conversación no disponible
            </h2>
            <p className="mt-2 max-w-md text-sm text-[#74716A] leading-relaxed">
              {roomAccessError}
            </p>
            <Link
              to="/app/matches"
              className="mt-6 rounded-lg bg-[#C17A4D] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#A6613A] focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/40 focus:ring-offset-2"
            >
              Volver a mis matches
            </Link>
          </div>
        ) : (
          <>
            <ConversationHeader
              participant={selectedMatch?.matchedUser ?? null}
              connectionStatus={connectionStatus}
              onBack={handleBackToList}
            />

            {connectionError && (
              <div
                role="alert"
                className="flex items-center justify-between gap-3 border-b border-[#C17A4D]/30 bg-[#C17A4D]/10 px-4 py-2 text-xs text-[#8C4D27]"
              >
                <span>{connectionError}</span>
                <button
                  type="button"
                  onClick={() => {
                    void retrySync();
                  }}
                  className="shrink-0 font-semibold underline underline-offset-2 hover:text-[#1C2321]"
                >
                  Reintentar
                </button>
              </div>
            )}

            {syncWarning && (
              <div
                role="status"
                className="flex items-center justify-between gap-3 border-b border-[#1F2A2E]/15 bg-[#1F2A2E]/5 px-4 py-2 text-xs text-[#1F2A2E]"
              >
                <span>{syncWarning}</span>
                <button
                  type="button"
                  onClick={() => {
                    void retrySync();
                  }}
                  className="shrink-0 font-semibold underline underline-offset-2"
                >
                  Sincronizar
                </button>
              </div>
            )}

            <MessageList
              key={selectedMatchId}
              messages={messages}
              currentUserId={user?.id ?? ""}
              historyStatus={historyStatus}
              historyError={historyError}
              hasMore={hasMore}
              isLoadingOlder={isLoadingOlder}
              olderError={olderError}
              onLoadOlder={loadOlderMessages}
              onRetryHistory={() => {
                void retrySync();
              }}
            />

            <MessageComposer
              key={`composer-${selectedMatchId}`}
              isConnected={connectionStatus === "connected"}
              isSending={isSending}
              feedback={sendFeedback}
              onSend={sendMessage}
              onClearFeedback={clearSendFeedback}
            />
          </>
        )}
      </section>
    </div>
  );
}

