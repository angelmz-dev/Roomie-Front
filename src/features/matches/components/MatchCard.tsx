import { useState, type ReactElement, type ReactNode } from "react";
import { formatCurrencyMxn } from "../../profile/utils/profile-validation";
import type { MatchItem } from "../types/matches.types";

interface MatchCardProps {
  match: MatchItem;
  actionSlot?: ReactNode;
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "RM";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function formatMatchDate(isoDate: string): string {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatBudgetSummary(
  minBudget: number | null,
  maxBudget: number | null,
): string | null {
  if (minBudget !== null && maxBudget !== null) {
    return `${formatCurrencyMxn(minBudget)} – ${formatCurrencyMxn(maxBudget)} / mes`;
  }

  if (maxBudget !== null) {
    return `Hasta ${formatCurrencyMxn(maxBudget)} / mes`;
  }

  if (minBudget !== null) {
    return `Desde ${formatCurrencyMxn(minBudget)} / mes`;
  }

  return null;
}

export default function MatchCard({
  match,
  actionSlot,
}: MatchCardProps): ReactElement {
  const { matchedUser } = match;
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);

  const showAvatarImage =
    Boolean(matchedUser.avatarUrl) &&
    failedAvatarUrl !== matchedUser.avatarUrl;
  const formattedDate = formatMatchDate(match.createdAt);
  const budgetText = formatBudgetSummary(
    matchedUser.minBudget,
    matchedUser.maxBudget,
  );
  const trimmedBio = matchedUser.bio?.trim() ?? "";

  return (
    <article
      aria-label={`Match con ${matchedUser.fullName}`}
      className="flex flex-col justify-between rounded-2xl border border-[#E7E2D6] bg-white p-6 shadow-sm transition hover:border-[#C17A4D]/50"
    >
      <div className="space-y-4">
        {/* Cabecera de persona y fecha */}
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-[#E7E2D6] bg-[#1F2A2E] flex items-center justify-center">
            {showAvatarImage && matchedUser.avatarUrl ? (
              <img
                src={matchedUser.avatarUrl}
                alt={`Fotografía de ${matchedUser.fullName}`}
                onError={() => setFailedAvatarUrl(matchedUser.avatarUrl)}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold tracking-wide text-[#FBF9F5]">
                {getInitials(matchedUser.fullName)}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-[#1C2321] truncate">
              {matchedUser.fullName}
            </h2>
            {formattedDate && (
              <p className="mt-0.5 text-xs text-[#74716A]">
                Match el{" "}
                <time dateTime={match.createdAt}>{formattedDate}</time>
              </p>
            )}
            {budgetText && (
              <p className="mt-2 inline-flex items-center rounded-full bg-[#FBF9F5] border border-[#E7E2D6] px-2.5 py-0.5 text-xs font-medium text-[#1C2321]">
                {budgetText}
              </p>
            )}
          </div>
        </div>

        {/* Biografía si está disponible */}
        {trimmedBio.length > 0 && (
          <p className="text-xs text-[#74716A] leading-relaxed">{trimmedBio}</p>
        )}

        {/* Zonas de interés */}
        {matchedUser.preferredZones.length > 0 && (
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#74716A]">
              Zonas de interés
            </p>
            <ul
              aria-label={`Zonas de interés de ${matchedUser.fullName}`}
              className="mt-2 flex flex-wrap gap-1.5"
            >
              {matchedUser.preferredZones.map((zone) => (
                <li
                  key={zone}
                  className="rounded-full bg-[#FBF9F5] border border-[#E7E2D6] px-2.5 py-0.5 text-xs font-medium text-[#1C2321]"
                >
                  {zone}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Slot reservado para la acción de conversación en Sprint 05 */}
      {actionSlot && (
        <div className="mt-5 pt-4 border-t border-[#E7E2D6]">{actionSlot}</div>
      )}
    </article>
  );
}

