import { useState, type ReactElement } from "react";
import type { MatchedUserSummary } from "../../matches/types/matches.types";
import type { ChatConnectionStatus } from "../types/chat.types";

interface ConversationHeaderProps {
  participant: MatchedUserSummary | null;
  connectionStatus: ChatConnectionStatus;
  onBack: () => void;
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "RM";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

const CONNECTION_BADGE_MAP: Record<
  ChatConnectionStatus,
  { label: string; className: string }
> = {
  connected: {
    label: "Conectado",
    className: "bg-[#1F2A2E] text-[#FBF9F5]",
  },
  connecting: {
    label: "Conectando...",
    className: "bg-[#FBF9F5] border border-[#E7E2D6] text-[#74716A]",
  },
  reconnecting: {
    label: "Reconectando...",
    className: "bg-[#C17A4D]/15 text-[#8C4D27]",
  },
  disconnected: {
    label: "Desconectado",
    className: "bg-[#C17A4D]/15 text-[#8C4D27]",
  },
  error: {
    label: "Sin conexión",
    className: "bg-[#C17A4D]/15 text-[#8C4D27]",
  },
};

export default function ConversationHeader({
  participant,
  connectionStatus,
  onBack,
}: ConversationHeaderProps): ReactElement {
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const fullName = participant?.fullName ?? "Conversación";
  const avatarUrl = participant?.avatarUrl ?? null;
  const showImage = Boolean(avatarUrl) && failedAvatarUrl !== avatarUrl;
  const badge = CONNECTION_BADGE_MAP[connectionStatus];

  return (
    <header className="flex items-center justify-between gap-3 border-b border-[#E7E2D6] bg-white px-4 py-3.5 sm:px-5">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver a la lista de conversaciones"
          className="md:hidden rounded-lg border border-[#E7E2D6] px-2.5 py-1.5 text-xs font-medium text-[#1C2321] transition hover:bg-[#FBF9F5] focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/30"
        >
          ←
        </button>

        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#E7E2D6] bg-[#1F2A2E] flex items-center justify-center">
          {showImage && avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`Fotografía de ${fullName}`}
              onError={() => setFailedAvatarUrl(avatarUrl)}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs font-semibold text-[#FBF9F5]">
              {getInitials(fullName)}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-[#1C2321] truncate">
            {fullName}
          </h2>
          {participant && participant.preferredZones.length > 0 && (
            <p className="text-xs text-[#74716A] truncate">
              {participant.preferredZones.join(" · ")}
            </p>
          )}
        </div>
      </div>

      <span
        role="status"
        aria-live="polite"
        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${badge.className}`}
      >
        {badge.label}
      </span>
    </header>
  );
}

