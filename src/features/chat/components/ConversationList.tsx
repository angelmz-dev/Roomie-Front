import { useState, type ReactElement } from "react";
import type { MatchItem, MatchesStatus } from "../../matches/types/matches.types";

interface ConversationListProps {
  status: MatchesStatus;
  matches: MatchItem[];
  selectedMatchId: string | null;
  error: string | null;
  onSelectMatch: (matchId: string) => void;
  onRetry: () => void;
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "RM";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

interface ConversationListItemProps {
  match: MatchItem;
  isSelected: boolean;
  onSelect: () => void;
}

function ConversationListItem({
  match,
  isSelected,
  onSelect,
}: ConversationListItemProps): ReactElement {
  const { matchedUser } = match;
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const showImage =
    Boolean(matchedUser.avatarUrl) &&
    failedAvatarUrl !== matchedUser.avatarUrl;

  const zoneSummary =
    matchedUser.preferredZones.length > 0
      ? matchedUser.preferredZones.slice(0, 2).join(", ")
      : "Conversación privada";

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={isSelected ? "page" : undefined}
        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#C17A4D]/40 ${
          isSelected
            ? "bg-[#C17A4D]/12 border-r-2 border-[#C17A4D]"
            : "hover:bg-[#FBF9F5]"
        }`}
      >
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[#E7E2D6] bg-[#1F2A2E] flex items-center justify-center">
          {showImage && matchedUser.avatarUrl ? (
            <img
              src={matchedUser.avatarUrl}
              alt={`Fotografía de ${matchedUser.fullName}`}
              onError={() => setFailedAvatarUrl(matchedUser.avatarUrl)}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs font-semibold text-[#FBF9F5]">
              {getInitials(matchedUser.fullName)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium truncate ${
              isSelected ? "text-[#1C2321]" : "text-[#1C2321]"
            }`}
          >
            {matchedUser.fullName}
          </p>
          <p className="mt-0.5 text-xs text-[#74716A] truncate">{zoneSummary}</p>
        </div>
      </button>
    </li>
  );
}

export default function ConversationList({
  status,
  matches,
  selectedMatchId,
  error,
  onSelectMatch,
  onRetry,
}: ConversationListProps): ReactElement {
  return (
    <aside
      aria-label="Conversaciones disponibles"
      className="flex h-full flex-col border-r border-[#E7E2D6] bg-white"
    >
      <div className="px-4 py-4 border-b border-[#E7E2D6]">
        <h1 className="text-base font-semibold text-[#1C2321]">
          Conversaciones
        </h1>
        <p className="mt-0.5 text-xs text-[#74716A]">
          Tus matches activos en Roomie-Match
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {status === "loading" && (
          <div
            role="status"
            className="p-6 text-center text-xs text-[#74716A]"
          >
            Cargando conversaciones...
          </div>
        )}

        {status === "error" && (
          <div role="alert" className="p-6 text-center space-y-3">
            <p className="text-xs text-[#8C4D27]">
              {error ?? "No se pudieron cargar tus matches."}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg bg-[#C17A4D] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#A6613A] focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/40"
            >
              Reintentar
            </button>
          </div>
        )}

        {status === "empty" && (
          <div className="p-6 text-center text-xs text-[#74716A] leading-relaxed">
            Aún no tienes matches con los que conversar.
          </div>
        )}

        {status === "ready" && (
          <ul className="divide-y divide-[#E7E2D6]/60">
            {matches.map((match) => (
              <ConversationListItem
                key={match.matchId}
                match={match}
                isSelected={match.matchId === selectedMatchId}
                onSelect={() => onSelectMatch(match.matchId)}
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

