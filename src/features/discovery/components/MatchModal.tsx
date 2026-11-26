import { useEffect, useRef, type ReactElement } from "react";
import { formatCurrencyMxn } from "../../profile/utils/profile-validation";
import type { MatchEvent } from "../types/discovery.types";

interface MatchModalProps {
  matchEvent: MatchEvent;
  onContinue: () => void;
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "RM";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export default function MatchModal({
  matchEvent,
  onContinue,
}: MatchModalProps): ReactElement {
  const continueButtonRef = useRef<HTMLButtonElement | null>(null);
  const { candidate } = matchEvent;

  useEffect(() => {
    continueButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onContinue();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onContinue]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F2A2E]/70 p-4 backdrop-blur-[2px]"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#E7E2D6] bg-[#FBF9F5] p-6 sm:p-8 shadow-2xl text-center">
        <span className="inline-block rounded-full bg-[#C17A4D]/15 px-3 py-1 text-xs font-semibold text-[#8C4D27]">
          Coincidencia mutua
        </span>

        <div className="mt-5 mx-auto h-20 w-20 overflow-hidden rounded-full border-2 border-[#C17A4D] bg-[#1F2A2E] flex items-center justify-center">
          {candidate.avatarUrl ? (
            <img
              src={candidate.avatarUrl}
              alt={`Fotografía de ${candidate.fullName}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xl font-semibold text-[#FBF9F5]">
              {getInitials(candidate.fullName)}
            </span>
          )}
        </div>

        <h2
          id="match-modal-title"
          className="mt-4 text-2xl font-semibold text-[#1C2321]"
        >
          ¡Es un match!
        </h2>
        <p className="mt-2 text-sm text-[#74716A] leading-relaxed">
          Tú y{" "}
          <span className="font-semibold text-[#1C2321]">
            {candidate.fullName}
          </span>{" "}
          mostraron interés mutuo para compartir habitación.
        </p>

        <div className="mt-5 rounded-xl border border-[#E7E2D6] bg-white p-4 text-left text-xs space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#74716A]">Presupuesto</span>
            <span className="font-medium text-[#1C2321]">
              {formatCurrencyMxn(candidate.minBudget)} –{" "}
              {formatCurrencyMxn(candidate.maxBudget)} / mes
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {candidate.preferredZones.map((zone) => (
              <span
                key={zone}
                className="rounded-full bg-[#FBF9F5] border border-[#E7E2D6] px-2.5 py-0.5 font-medium text-[#1C2321]"
              >
                {zone}
              </span>
            ))}
          </div>
        </div>

        <p className="mt-4 text-xs text-[#74716A]">
          La bandeja de Matches y el Chat estarán disponibles en los próximos
          sprints.
        </p>

        <button
          ref={continueButtonRef}
          type="button"
          onClick={onContinue}
          className="mt-6 w-full rounded-xl bg-[#C17A4D] py-2.5 text-sm font-medium text-white transition hover:bg-[#A6613A] focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/40 focus:ring-offset-2"
        >
          Seguir explorando
        </button>
      </div>
    </div>
  );
}

